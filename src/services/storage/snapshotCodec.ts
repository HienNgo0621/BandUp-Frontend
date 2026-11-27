import { failure, type Result } from '../domain/contracts';
import { migrateSnapshot } from '../domain/migrateSnapshot';
import type { DomainSnapshot } from '../domain/schema';
import { guards, type Guard } from '../domain/snapshotValidation';
import { isRecord } from './localStorageService';

export interface MigrationSummary {
  sourceVersion: 1 | 2; targetVersion: 2; acceptedRecords: number;
  normalizedIdentifiers: number; quarantinedFragments: number; retainedReviewEntries: number;
}
export interface PreparedSnapshot { snapshot: DomainSnapshot; raw: string; summary: MigrationSummary }

type Guarded<G> = G extends Guard<infer T> ? T : never;
type OptionalFields<T> = { [K in keyof T as {} extends Pick<T, K> ? K : never]-?: true };
// Compile-time checked against the accepted guards. This is serialization
// metadata, not another validator: the normalized snapshot is still validated.
const optionalFields: { [K in keyof typeof guards]: OptionalFields<Guarded<(typeof guards)[K]>> } = {
  users: { email: true, profile: true, createdAt: true, updatedAt: true },
  notes: { example: true, source: true, dateLabel: true, reference: true }, task: {},
  questionBank: { source: true, questionCount: true, durationMinutes: true, sections: true, createdAt: true, updatedAt: true },
  submissions: { visibility: true, content: true, durationSeconds: true, relatedForumPostId: true, taskId: true, updatedAt: true },
  forumPosts: { skill: true, authorName: true, topicId: true, topicKey: true, submissionId: true, reactionCount: true,
    commentCount: true, shareCount: true, createdAt: true, updatedAt: true },
  practiceHistory: { durationSeconds: true, score: true, createdAt: true, updatedAt: true }, grading: { rubricScores: true },
  applications: { decisionReason: true, decidedBy: true, decidedAt: true, evidence: true, createdAt: true, updatedAt: true },
  attempts: { submittedAt: true, remainingSeconds: true, result: true, createdAt: true, updatedAt: true },
  notifications: { relatedRoute: true, relatedEntityId: true, updatedAt: true }, registrations: { updatedAt: true },
  forumTopics: { description: true, createdAt: true, updatedAt: true },
  forumComments: { parentId: true, hidden: true, createdAt: true, updatedAt: true }, forumReports: { createdAt: true, updatedAt: true },
  review: { detail: true },
};
const nestedOptional: Record<string, readonly string[]> = {
  'notes.*.reference': ['token', 'question'],
  'questionBank.*.sections.*': ['instructions', 'content'],
  'questionBank.*.sections.*.groups.*.questions.*': ['options', 'answerKey', 'acceptedAnswers', 'explanation'],
  'attempts.*.result': ['score', 'band', 'correct', 'incorrect', 'unanswered', 'skillScores'],
  'attempts.*.result.skillScores': ['Reading', 'Listening', 'Writing', 'Speaking'],
};
type Path = (string | number)[];
function optionalUndefined(path: Path): boolean {
  const key = path[path.length - 1]; if (typeof key !== 'string') return false;
  const parent = path.slice(0, -1).map((part) => typeof part === 'number' ? '*' : part).join('.');
  // UserProfile explicitly permits undefined values in its string index signature.
  if (parent === 'users.*.profile') return true;
  if (Object.hasOwn(nestedOptional, parent)) return nestedOptional[parent].includes(key);
  const kind = path[0] === 'migrationReview' ? 'review' : path[0];
  return path.length === 3 && typeof path[1] === 'number' && typeof kind === 'string' && Object.hasOwn(optionalFields, kind) &&
    Object.hasOwn(optionalFields[kind as keyof typeof optionalFields], key);
}
function plainJson(value: unknown, path: Path = [], seen = new Set<object>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || seen.has(value)) throw new Error('Unsupported JSON value');
  const array = Array.isArray(value); const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw new Error('Unsupported prototype');
  for (const base of [prototype, Object.prototype]) {
    const hook = base && Object.getOwnPropertyDescriptor(base, 'toJSON');
    if (hook && (!('value' in hook) || typeof hook.value === 'function')) throw new Error('Unsupported serializer');
  }
  seen.add(value);
  try {
    const entries: [string, unknown][] = [];
    for (const key of Reflect.ownKeys(value)) {
      if (array && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || !descriptor || !('value' in descriptor) || !descriptor.enumerable)
        throw new Error('Unsupported property');
      if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) throw new Error('Unsupported array property');
      const next = [...path, array ? Number(key) : key];
      if (descriptor.value === undefined && optionalUndefined(next)) continue;
      entries.push([key, plainJson(descriptor.value, next, seen)]);
    }
    if (!array) return Object.fromEntries(entries);
    if (entries.length !== value.length) throw new Error('Sparse array');
    return entries.map(([, entry]) => entry);
  } finally { seen.delete(value); }
}
export function serializeSnapshot(value: unknown): Result<string> {
  try {
    return { ok: true, value: JSON.stringify(plainJson(value)) };
  } catch { return failure('serialization-failed', 'These changes could not be prepared for saving.'); }
}
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])]));
  return value;
}
export function equalSnapshot(a: unknown, b: unknown): boolean { return JSON.stringify(ordered(a)) === JSON.stringify(ordered(b)); }
export function parseSnapshot(raw: string): Result<Record<string, unknown>> {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return failure('invalid-json', 'Your saved data needs recovery before it can be used.'); }
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') return failure('invalid-snapshot', 'Your saved data needs recovery before it can be used.');
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) return failure('unsupported-schema', 'This saved data requires a compatible application.');
  return { ok: true, value };
}
export function prepareMigration(raw: string): Result<PreparedSnapshot> {
  try { return prepare(raw); }
  catch { return failure('invalid-snapshot', 'Your saved data could not be safely prepared for migration.'); }
}
function prepare(raw: string): Result<PreparedSnapshot> {
  const source = parseSnapshot(raw); if (!source.ok) return source;
  const converted = migrateSnapshot(source.value);
  if (!converted.ok) return failure('invalid-snapshot', 'Your saved data needs review before migration.');
  const encoded = serializeSnapshot(converted.value); if (!encoded.ok) return encoded;
  const roundTrip = migrateSnapshot(JSON.parse(encoded.value));
  if (!roundTrip.ok || !equalSnapshot(converted.value, roundTrip.value)) return failure('invalid-snapshot', 'The prepared data could not be verified.');
  const snapshot = converted.value;
  const records = [snapshot.users, snapshot.questionBank, snapshot.notifications, snapshot.registrations, snapshot.applications,
    snapshot.submissions, snapshot.grading, snapshot.forumTopics, snapshot.forumPosts, snapshot.forumComments,
    snapshot.forumReports, snapshot.practiceHistory, snapshot.notes, snapshot.attempts, ...Object.values(snapshot.studyPlan)];
  const prior = source.value.schemaVersion === 2 && Array.isArray(source.value.migrationReview) ? source.value.migrationReview.length : 0;
  const numericNotes = Array.isArray(source.value.notes) ? source.value.notes.filter((row) => isRecord(row) && typeof row.id === 'number' && snapshot.notes.some((note) => note.id === `notes:legacy-number:${row.id}`)).length : 0;
  const numericTasks = isRecord(source.value.studyPlan) ? Object.values(source.value.studyPlan).flatMap((rows) => Array.isArray(rows) ? rows : []).filter((row) => isRecord(row) && typeof row.id === 'number' && Object.values(snapshot.studyPlan).flat().some((task) => task.id === `studyTask:legacy-number:${row.id}`)).length : 0;
  return { ok: true, value: { snapshot, raw: encoded.value, summary: { sourceVersion: source.value.schemaVersion === 1 ? 1 : 2,
    targetVersion: 2, acceptedRecords: records.reduce((n, rows) => n + rows.length, 0), normalizedIdentifiers: numericNotes + numericTasks,
    quarantinedFragments: snapshot.migrationReview.length - prior, retainedReviewEntries: prior } } };
}
export function inspectSnapshot(raw: string): Result<{ version: 1 | 2; value: Record<string, unknown>; snapshot: DomainSnapshot }> {
  const source = parseSnapshot(raw); if (!source.ok) return source;
  const prepared = prepareMigration(raw); if (!prepared.ok) return prepared;
  if (source.value.schemaVersion === 2 && !equalSnapshot(source.value, prepared.value.snapshot))
    return failure('invalid-snapshot', 'Your saved data needs review before it can be used.');
  return { ok: true, value: { version: source.value.schemaVersion === 1 ? 1 : 2, value: source.value, snapshot: prepared.value.snapshot } };
}
// Never duplicate credentials into a new recovery artifact. Descriptive note
// tokens are not authentication tokens. No source value is printed or returned in errors.
export function containsCredentials(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCredentials);
  if (isRecord(value)) return Object.entries(value).some(([key, val]) =>
    /^(password|pwd|pass|passwordHash|accessToken|refreshToken|authToken|sessionToken|apiKey|clientSecret)$/i.test(key) || containsCredentials(val));
  if (typeof value === 'string' && /^[\s]*[\[{]/.test(value)) {
    try { return containsCredentials(JSON.parse(value)); } catch { return false; }
  }
  return false;
}
