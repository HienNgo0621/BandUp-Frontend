import { isRecord } from '../storage/localStorageService';
import { failure, type OwnedAttempt, type OwnedRecord, type Result } from './contracts';
import { DOMAIN_SCHEMA_VERSION, type DomainSnapshot, type MigrationReview } from './schema';
import { finalizedResult, guards, id, isStudyDay, json, jsonRecord, nestedFields, number, type Guard } from './snapshotValidation';

// Pure staged conversion: no storage, seeding, current-session inference or deletion.
export function migrateSnapshot(input: unknown): Result<DomainSnapshot> {
  if (!isRecord(input)) return failure('corrupt-data', 'The stored data is not an object.');
  const sourceData = input;
  if (input.schemaVersion !== 1 && input.schemaVersion !== DOMAIN_SCHEMA_VERSION)
    return failure('unsupported-schema', 'This data version requires a supported migration.');
  const arrays = ['users', 'questionBank', 'notifications', 'registrations', 'applications', 'submissions',
    'grading', 'forumTopics', 'forumPosts', 'forumComments', 'forumReports', 'practiceHistory', 'notes', 'supportMessages'];
  if (!arrays.every((key) => Array.isArray(input[key])) || !isRecord(input.studyPlan) || !isRecord(input.legacy) ||
    !jsonRecord(input.preferences) || !Array.isArray(input.supportMessages) || !input.supportMessages.every(json) ||
    !(input.migratedAt === null || number(input.migratedAt)))
    return failure('corrupt-data', 'Required data collections are missing or malformed.');
  if (input.schemaVersion === 2 && (!Number.isSafeInteger(input.revision) || Number(input.revision) < 0 ||
    !Array.isArray(input.attempts) || !Array.isArray(input.migrationReview)))
    return failure('corrupt-data', 'The versioned data envelope is malformed.');
  // V1 has no required attempts collection. Present unsupported JSON is recovery
  // data, not evidence that the collection is empty. Non-JSON cannot round-trip.
  if (input.schemaVersion === 1 && Object.hasOwn(input, 'attempts') && !Array.isArray(input.attempts) && !json(input.attempts))
    return failure('corrupt-data', 'The legacy attempts collection cannot be safely preserved.');
  const hasPlaintextPassword = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(hasPlaintextPassword);
    return isRecord(value) && Object.entries(value).some(([key, val]) =>
      /^(password|pwd|pass)$/i.test(key) || hasPlaintextPassword(val));
  };
  if (hasPlaintextPassword(input))
    return failure('corrupt-data', 'Legacy credentials require a separate migration review.');

  const review: MigrationReview[] = [];
  if (input.schemaVersion === 2) {
    const previous: unknown[] = Array.isArray(input.migrationReview) ? input.migrationReview : [];
    for (const item of previous) {
      if (!isRecord(item) || !('original' in item) || !guards.review(item))
        return failure('corrupt-data', 'The migration review is malformed.');
      review.push(item);
    }
  }
  const preserve = (path: string, original: unknown, reason: MigrationReview['reason'], detail?: string) => {
    review.push(detail === undefined ? { path, original, reason } : { path, original, reason, detail });
  };
  const known = new Set([...arrays, 'schemaVersion', 'revision', 'attempts', 'migrationReview', 'studyPlan', 'legacy', 'preferences', 'migratedAt']);
  if (input.schemaVersion === 1) {
    // These envelope fields are not defined by v1. Keep unexpected source
    // context rather than silently replacing it with the v2 envelope values.
    for (const key of ['revision', 'migrationReview']) {
      if (Object.hasOwn(input, key)) preserve(key, input[key], 'unrecognized-field');
    }
  }
  for (const [key, value] of Object.entries(input)) {
    if (known.has(key)) continue;
    if (!json(value)) return failure('corrupt-data', 'An unrecognized field cannot be safely preserved.');
    preserve(key, value, 'unrecognized-field');
  }
  const origins = new WeakMap<object, { path: string; original: unknown }>();
  const reject = (row: object, reason: MigrationReview['reason'], detail?: string, path?: string) => {
    const source = origins.get(row);
    preserve(path ?? source?.path ?? '', source?.original ?? row, reason, detail);
    return false;
  };
  function records<T extends { id: string }>(key: string, guard: Guard<T>, numericIds = false): T[] {
    const collection = sourceData[key];
    if (!Array.isArray(collection)) {
      if (Object.hasOwn(sourceData, key)) preserve(key, collection, 'invalid-collection');
      return [];
    }
    const source: unknown[] = collection;
    const normalized = source.map((original) => {
      if (!isRecord(original)) return original;
      const recordId = numericIds && typeof original.id === 'number' && Number.isSafeInteger(original.id)
        ? `${key}:legacy-number:${original.id}` : original.id;
      return { ...original, id: recordId };
    });
    const counts = new Map<string, number>();
    normalized.forEach((row) => { if (isRecord(row) && id(row.id)) counts.set(row.id, (counts.get(row.id) ?? 0) + 1); });
    return normalized.flatMap((row, index) => {
      const path = `${key}[${index}]`;
      if (!guard(row)) {
        const nested = isRecord(row) && Object.entries(nestedFields[key] ?? {}).some(([field, validate]) => !validate(row[field]));
        preserve(path, source[index], nested ? 'invalid-nested-data' : 'invalid-record');
        return [];
      }
      if (counts.get(row.id) !== 1) { preserve(path, source[index], 'duplicate-id'); return []; }
      origins.set(row, { path, original: source[index] });
      return [row];
    });
  }
  const users = records('users', guards.users);
  function ownedRecords<T extends { id: string }>(key: string, guard: Guard<T>, ownerField: string, ownerRole?: string, numericIds = false): (T & OwnedRecord)[] {
    return records(key, guard, numericIds).flatMap((row) => {
      const fields: Record<string, unknown> = { ...row };
      const ownerId = fields.ownerId ?? fields[ownerField];
      const owner = users.find((user) => user.id === ownerId);
      if (!id(ownerId) || !owner || (ownerRole && owner.role !== ownerRole) ||
        (ownerField !== 'ownerId' && fields[ownerField] !== ownerId)) {
        reject(row, 'owner-unresolved'); return [];
      }
      const owned = { ...row, ownerId };
      const source = origins.get(row);
      if (source) origins.set(owned, source);
      return [owned];
    });
  }
  let submissions = ownedRecords('submissions', guards.submissions, 'studentId', 'student');
  const notes = ownedRecords('notes', guards.notes, 'ownerId', 'student', true);

  // Invalid groups are preserved as whole source groups, before task conversion.
  // Only accepted groups contribute to active task uniqueness. fromEntries never
  // invokes an object's __proto__ setter, including after a JSON round trip.
  const groups: [string, unknown[]][] = [];
  for (const [day, rows] of Object.entries(input.studyPlan)) {
    if (!isStudyDay(day)) { preserve(`studyPlan.${day}`, rows, 'invalid-group-key'); continue; }
    if (!Array.isArray(rows)) { preserve(`studyPlan.${day}`, rows, 'invalid-record'); continue; }
    groups.push([day, rows]);
  }
  const taskId = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) ? `studyTask:legacy-number:${value}` : value;
  const taskIds = new Map<string, number>();
  groups.forEach(([, rows]) => rows.forEach((row) => {
    const key = isRecord(row) ? taskId(row.id) : undefined;
    if (id(key)) taskIds.set(key, (taskIds.get(key) ?? 0) + 1);
  }));
  const studyPlan = Object.fromEntries<DomainSnapshot['studyPlan'][string]>(groups.map(([day, rows]):
    [string, DomainSnapshot['studyPlan'][string]] => [day, rows.flatMap((original, index) => {
    const path = `studyPlan.${day}[${index}]`;
    if (!isRecord(original)) { preserve(path, original, 'invalid-record'); return []; }
    const task = { ...original, id: taskId(original.id) };
    if (!guards.task(task)) { preserve(path, original, 'invalid-record'); return []; }
    if (taskIds.get(task.id) !== 1) { preserve(path, original, 'duplicate-id'); return []; }
    const ownerId = original.ownerId;
    if (!id(ownerId) || !users.some((user) => user.id === ownerId && user.role === 'student')) {
      preserve(path, original, 'owner-unresolved'); return [];
    }
    return [{ ...task, ownerId }];
  })]));

  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  const questionBank = records('questionBank', guards.questionBank).filter((row) => {
    const sections = row.sections ?? [];
    const groups = sections.flatMap((section) => section.groups);
    if (unique(sections.map((section) => section.id)) && unique(groups.map((group) => group.id)) &&
      unique(groups.flatMap((group) => group.questions.map((question) => question.id)))) return true;
    return reject(row, 'duplicate-id', 'Nested content IDs must be unambiguous within their question set.');
  });
  const notifications = records('notifications', guards.notifications).filter((row) => {
    if (!users.some((user) => user.id === row.recipientId) && !['all:student', 'all:teacher', 'all:admin'].includes(row.recipientId))
      return reject(row, 'owner-unresolved', 'The notification recipient cannot be resolved.');
    return row.readBy.every((userId) => users.some((user) => user.id === userId)) ||
      reject(row, 'broken-reference', 'A notification read-history user is unavailable.');
  });
  const registrations = records('registrations', guards.registrations);
  const forumTopics = records('forumTopics', guards.forumTopics);
  let forumPosts = ownedRecords('forumPosts', guards.forumPosts, 'authorId');
  // Both optional links must resolve against the final accepted collections.
  // Start with shape/owner-valid candidates and only remove broken dependencies;
  // valid mutually linked records survive. No reciprocal/one-to-one rule is assumed.
  let removed: boolean;
  do {
    const postIds = new Set(forumPosts.map((row) => row.id));
    const submissionById = new Map(submissions.map((row) => [row.id, row]));
    const nextSubmissions = submissions.filter((row) => !row.relatedForumPostId || postIds.has(row.relatedForumPostId) ||
      reject(row, 'broken-reference', 'The explicitly linked Forum post is unavailable.'));
    const nextPosts = forumPosts.filter((row) => {
      if (row.topicId && !forumTopics.some((topic) => topic.id === row.topicId && (!row.topicKey || row.topicKey === topic.key)))
        return reject(row, 'broken-reference', 'The explicit topic relation is missing or inconsistent.');
      return !row.submissionId || submissionById.get(row.submissionId)?.studentId === row.authorId ||
        reject(row, 'broken-reference', 'The linked submission is missing or has a conflicting author.');
    });
    removed = nextSubmissions.length !== submissions.length || nextPosts.length !== forumPosts.length;
    submissions = nextSubmissions;
    forumPosts = nextPosts;
  } while (removed);
  const grading = ownedRecords('grading', guards.grading, 'teacherId', 'teacher').filter((row) =>
    submissions.some((submission) => submission.id === row.submissionId) ||
    reject(row, 'broken-reference', 'The referenced submission is unavailable.', `grading:${row.id}`));
  const eligibleComments = records('forumComments', guards.forumComments).filter((row) =>
    (forumPosts.some((post) => post.id === row.postId && post.status !== 'deleted') && users.some((user) => user.id === row.authorId)) ||
    reject(row, 'broken-reference', 'A comment requires an existing author and a non-deleted post.'));
  const commentMap = new Map(eligibleComments.map((row) => [row.id, row]));
  const forumComments = eligibleComments.filter((row) => {
    const visited = new Set([row.id]); let parentId = row.parentId;
    while (parentId) {
      const parent = commentMap.get(parentId);
      if (!parent || parent.postId !== row.postId || visited.has(parentId))
        return reject(row, 'broken-reference', 'The reply chain is missing, cyclic or belongs to another post.');
      visited.add(parentId); parentId = parent.parentId;
    }
    return true;
  });
  // A report can remain historical evidence for an existing soft-deleted post.
  // A nonexistent post/user has no supported snapshot representation: review it.
  const forumReports = records('forumReports', guards.forumReports).filter((row) =>
    (forumPosts.some((post) => post.id === row.postId) && users.some((user) => user.id === row.reporterId)) ||
    reject(row, 'broken-reference', 'The report post or reporter is unavailable.'));
  const attempts = ownedRecords('attempts', guards.attempts, 'userId', 'student').filter((row): row is OwnedAttempt => {
    const content = questionBank.find((set) => set.id === row.questionSetId);
    if (!content) return reject(row, 'broken-reference', 'The referenced question set is unavailable; no historical content snapshot was supplied.');
    if (!unique(row.answers.map((answer) => answer.questionId)))
      return reject(row, 'duplicate-answer', 'Conflicting answers cannot be resolved by array order.');
    if (content.sections) {
      const questions = new Set(content.sections.flatMap((section) => section.groups.flatMap((group) => group.questions.map((question) => question.id))));
      if (row.answers.some((answer) => !questions.has(answer.questionId)) || row.flaggedQuestionIds.some((key) => !questions.has(key)))
        return reject(row, 'broken-reference', 'An answer or flag references a question absent from the supplied content.');
    }
    if (row.status === 'completed' && (row.stage !== 'Completed' || !finalizedResult(row.result)))
      return reject(row, 'invalid-state', 'A completed attempt requires a completed stage and nonempty finalized result data.');
    if (row.skill !== 'Mock Test' && (content.skill !== row.skill || (row.stage !== 'Completed' && row.stage !== row.skill)))
      return reject(row, 'invalid-state', 'The attempt skill, stage and content disagree.');
    if ((row.status === 'in_progress' && row.stage === 'Completed') || (row.remainingSeconds !== undefined && row.remainingSeconds < 0) ||
      (row.submittedAt !== undefined && row.submittedAt < row.startedAt))
      return reject(row, 'invalid-state', 'The attempt lifecycle or timestamps are inconsistent.');
    return true;
  });
  const applications = ownedRecords('applications', guards.applications, 'ownerId').filter((row) =>
    row.decidedBy == null || users.some((user) => user.id === row.decidedBy) ||
    reject(row, 'broken-reference', 'The explicit application decision user is unavailable.'));
  const practiceHistory = ownedRecords('practiceHistory', guards.practiceHistory, 'userId', 'student');
  return { ok: true, value: {
    schemaVersion: 2, revision: input.schemaVersion === 2 ? Number(input.revision) : 0,
    users, questionBank, notifications, legacy: input.legacy, migratedAt: input.migratedAt,
    registrations, applications, submissions, grading, forumTopics, forumPosts, forumComments, forumReports,
    practiceHistory, notes, studyPlan, attempts, migrationReview: review,
    preferences: input.preferences, supportMessages: input.supportMessages,
  } };
}
