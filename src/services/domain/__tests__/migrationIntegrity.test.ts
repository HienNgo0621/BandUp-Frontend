import { describe, expect, it } from 'vitest';
import { migrateSnapshot } from '../migrateSnapshot';
import type { DomainSnapshot } from '../schema';

const user = { id: 'ir-student', name: 'Synthetic Student', role: 'student', status: 'active', label: 'Learner' };
const teacher = { ...user, id: 'ir-teacher', role: 'teacher' };
const post = { id: 'ir-post', authorId: user.id, title: 'Synthetic post', body: 'Synthetic body', tags: [], visibility: 'PUBLIC', status: 'published' };
const submission = { id: 'ir-submission', studentId: user.id, title: 'Synthetic submission', skill: 'Writing', status: 'posted', createdAt: 1 };
const content = { id: 'ir-set', title: 'Synthetic content', skill: 'Reading', status: 'Archived' };
const attempt = { id: 'qa-preserve-me', ownerId: user.id, userId: user.id, questionSetId: content.id, skill: 'Reading',
  status: 'completed', stage: 'Completed', startedAt: 1, submittedAt: 2, answers: [], flaggedQuestionIds: [], result: { correct: 0 } };
function base(version = 1): Record<string, unknown> {
  return { schemaVersion: version, users: [user, teacher], questionBank: [content], notifications: [], registrations: [], applications: [],
    submissions: [], grading: [], forumTopics: [], forumPosts: [], forumComments: [], forumReports: [], practiceHistory: [], notes: [],
    supportMessages: [], studyPlan: {}, legacy: {}, preferences: {}, migratedAt: null,
    ...(version === 2 ? { revision: 3, migrationReview: [], attempts: [] } : {}) };
}
function convert(input: unknown): DomainSnapshot {
  const before = JSON.stringify(input);
  const result = migrateSnapshot(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  expect(migrateSnapshot(input)).toEqual(result);
  expect(migrateSnapshot(JSON.parse(JSON.stringify(result.value)))).toEqual(result);
  return result.value;
}
function preserved(output: DomainSnapshot, original: unknown, reason?: string) {
  expect(output.migrationReview).toContainEqual(expect.objectContaining({ original, ...(reason ? { reason } : {}) }));
}

describe('FIX-01A-05 / IR-M12 collection preservation — BU-026, NFR-21', () => {
  it('distinguishes absent v1 attempts from an explicit empty or valid populated array', () => {
    for (const extension of [{}, { attempts: [] }, { attempts: [attempt] }]) {
      const output = convert({ ...base(), ...extension });
      expect(output.attempts).toEqual('attempts' in extension ? extension.attempts : []);
      expect(output.migrationReview).toEqual([]);
    }
  });
  it.each([{ legacySession: attempt }, null, 'unsupported', 27, false])('quarantines the exact present unsupported v1 attempts payload (%#)', (original) => {
    const output = convert({ ...base(), attempts: original });
    expect(output.attempts).toEqual([]);
    expect(output.users).toEqual([user, teacher]);
    expect(output.questionBank).toEqual([content]);
    expect(output.migrationReview).toContainEqual({ path: 'attempts', reason: 'invalid-collection', original });
  });
  it.each([{ legacySession: attempt }, null, 'unsupported', 27, false, undefined])('rejects an invalid v2 attempts envelope without touching input (%#)', (attempts) => {
    const input = { ...base(2), attempts }; const before = JSON.stringify(input);
    expect(migrateSnapshot(input)).toMatchObject({ ok: false, error: { code: 'corrupt-data', retryable: false } });
    expect(JSON.stringify(input)).toBe(before);
  });
  it('rejects a present non-JSON v1 attempts value instead of producing an unserializable recovery entry', () => {
    expect(migrateSnapshot({ ...base(), attempts: undefined })).toMatchObject({ ok: false, error: { code: 'corrupt-data' } });
  });
  it('keeps valid v2 attempts and preserves malformed siblings without changing IDs or owners', () => {
    for (const version of [1, 2]) {
      const output = convert({ ...base(version), attempts: [attempt, null, { id: 'invalid-attempt' }] });
      expect(output.attempts).toEqual([attempt]); preserved(output, null); preserved(output, { id: 'invalid-attempt' });
    }
  });
});

describe('FIX-01A-06 / IR-M13 final relationship closure — BU-026', () => {
  it('retains a submission with no optional Forum reference', () => {
    expect(convert({ ...base(), submissions: [submission] }).submissions).toEqual([{ ...submission, ownerId: user.id }]);
  });
  it.each(['published', 'hidden', 'deleted', 'draft'])('retains an existing valid %s historical target without imposing visibility or publication constraints', (status) => {
    const row = { ...submission, relatedForumPostId: post.id };
    const output = convert({ ...base(), submissions: [row], forumPosts: [{ ...post, status }] });
    expect(output.submissions).toEqual([{ ...row, ownerId: user.id }]); expect(output.forumPosts).toHaveLength(1);
    expect(output.migrationReview).toEqual([]);
  });
  it.each(['missing', 'malformed', 'rejected-owner', 'rejected-topic', 'duplicate-id'])('preserves a submission whose explicit target is %s', (target) => {
    const row = { ...submission, relatedForumPostId: post.id };
    const posts = target === 'missing' ? [] : target === 'malformed' ? [{ ...post, body: null }] : target === 'rejected-owner' ? [{ ...post, authorId: 'missing-user' }]
      : target === 'rejected-topic' ? [{ ...post, topicId: 'missing-topic' }] : [post, { ...post, body: 'Ambiguous duplicate' }];
    const output = convert({ ...base(), submissions: [row], forumPosts: posts });
    expect(output.submissions).toEqual([]); expect(output.forumPosts).toEqual([]); preserved(output, row, 'broken-reference');
    posts.forEach((original) => preserved(output, original));
  });
  it.each([null, 12, '', {}])('preserves a malformed optional reference rather than erasing it (%#)', (relatedForumPostId) => {
    const row = { ...submission, relatedForumPostId };
    const output = convert({ ...base(), submissions: [row] }); expect(output.submissions).toEqual([]); preserved(output, row);
  });
  it('keeps valid mutually linked records without requiring reciprocal or one-to-one links', () => {
    const row = { ...submission, relatedForumPostId: post.id };
    const linkedPost = { ...post, submissionId: row.id };
    const extra = { ...submission, id: 'another-submission', relatedForumPostId: post.id };
    const output = convert({ ...base(), submissions: [row, extra], forumPosts: [linkedPost] });
    expect(output.submissions.map((item) => item.id)).toEqual([row.id, extra.id]);
    expect(output.forumPosts.map((item) => item.id)).toEqual([post.id]); expect(output.migrationReview).toEqual([]);
  });
  it('settles chained dependencies before grading, comments and reports; preserves every rejected source exactly once', () => {
    const first = { ...submission, relatedForumPostId: 'missing-post' };
    const linkedPost = { ...post, submissionId: first.id };
    const dependent = { ...submission, id: 'dependent', relatedForumPostId: post.id };
    const grade = { id: 'grade', submissionId: dependent.id, teacherId: teacher.id, bandScore: 7, feedback: 'Synthetic', createdAt: 2, updatedAt: 2 };
    const comment = { id: 'comment', postId: post.id, authorId: user.id, body: 'Synthetic' };
    const report = { id: 'report', postId: post.id, reporterId: teacher.id, reason: 'Synthetic', detail: '', status: 'resolved' };
    const independent = { ...submission, id: 'independent' };
    const output = convert({ ...base(), submissions: [first, dependent, independent], forumPosts: [linkedPost], grading: [grade], forumComments: [comment], forumReports: [report] });
    expect(output.submissions.map((item) => item.id)).toEqual(['independent']);
    expect(output.forumPosts).toEqual([]); expect(output.grading).toEqual([]); expect(output.forumComments).toEqual([]); expect(output.forumReports).toEqual([]);
    const originals = [first, dependent, linkedPost, grade, comment, report];
    expect(output.migrationReview).toHaveLength(originals.length); originals.forEach((row) => preserved(output, row, 'broken-reference'));
  });
  it('preserves all of an unsupported cycle while retaining a separate valid cycle', () => {
    const bad = { ...submission, relatedForumPostId: post.id };
    const badPost = { ...post, submissionId: bad.id, topicId: 'missing-topic' };
    const good = { ...submission, id: 'good-submission', relatedForumPostId: 'good-post' };
    const goodPost = { ...post, id: 'good-post', submissionId: good.id };
    const output = convert({ ...base(), submissions: [bad, good], forumPosts: [badPost, goodPost] });
    expect(output.submissions.map((item) => item.id)).toEqual([good.id]); expect(output.forumPosts.map((item) => item.id)).toEqual([goodPost.id]);
    preserved(output, bad); preserved(output, badPost); expect(output.migrationReview).toHaveLength(2);
  });
});

describe('bounded collection/relationship inventory regression', () => {
  const arrays = ['users', 'questionBank', 'notifications', 'registrations', 'applications', 'submissions', 'grading', 'forumTopics',
    'forumPosts', 'forumComments', 'forumReports', 'practiceHistory', 'notes', 'supportMessages'];
  it.each(arrays)('safely rejects missing or malformed required %s across both schemas', (key) => {
    for (const version of [1, 2]) for (const invalid of [undefined, null, { populated: 'retained by error' }, 'invalid', 23]) {
      const input = base(version); if (invalid === undefined) delete input[key]; else input[key] = invalid;
      const before = JSON.stringify(input);
      expect(migrateSnapshot(input)).toMatchObject({ ok: false, error: { code: 'corrupt-data' } }); expect(JSON.stringify(input)).toBe(before);
    }
  });
  it.each(arrays.filter((key) => key !== 'supportMessages'))('preserves every invalid %s entry across both schemas', (key) => {
    for (const version of [1, 2]) {
      const rows = [null, 37, { id: 'invalid-source', recovery: { keep: true } }];
      const output = convert({ ...base(version), [key]: rows });
      expect(output[key as keyof DomainSnapshot]).toEqual([]); rows.forEach((row) => preserved(output, row));
    }
  });
  it.each(['legacy', 'preferences', 'studyPlan'])('rejects missing/non-object %s without replacing original data', (key) => {
    for (const version of [1, 2]) for (const invalid of [undefined, null, ['populated'], 'invalid']) {
      const input = { ...base(version), [key]: invalid }; const before = JSON.stringify(input);
      expect(migrateSnapshot(input)).toMatchObject({ ok: false, error: { code: 'corrupt-data' } }); expect(JSON.stringify(input)).toBe(before);
    }
  });
  it('preserves invalid study groups/tasks and valid numeric-ID tasks with explicit owners', () => {
    const valid = { id: 1, ownerId: user.id, title: 'Synthetic task', skill: 'Reading', minutes: 10, done: false };
    const invalid = { ...valid, id: 'invalid-task', done: 'wrong' };
    const orphan = { ...valid, id: 'orphan-task', ownerId: 'missing-user' };
    for (const version of [1, 2]) {
      const plan = JSON.parse(JSON.stringify({ '2026-11-26': [valid, invalid, orphan], '2026-11-27': { populated: 'unsupported' } }));
      const output = convert({ ...base(version), studyPlan: plan });
      expect(output.studyPlan['2026-11-26']).toEqual([{ ...valid, id: 'studyTask:legacy-number:1' }]);
      preserved(output, invalid); preserved(output, orphan); preserved(output, plan['2026-11-27']);
    }
  });
  it('rejects malformed v2 review envelopes and entries without replacing prior recovery data', () => {
    for (const migrationReview of [undefined, null, {}, [null], [{ path: 'prior', reason: 'invalid-record' }]]) {
      const input = { ...base(2), migrationReview }; const before = JSON.stringify(input);
      expect(migrateSnapshot(input)).toMatchObject({ ok: false, error: { code: 'corrupt-data' } }); expect(JSON.stringify(input)).toBe(before);
    }
  });
  it('preserves duplicate source IDs and rejects dependents of rejected target IDs', () => {
    const rows = [user, { ...user, name: 'Ambiguous owner' }];
    const linked = { ...submission, relatedForumPostId: post.id };
    const output = convert({ ...base(), users: rows, submissions: [linked], forumPosts: [post] });
    expect(output.users).toEqual([]); expect(output.submissions).toEqual([]); expect(output.forumPosts).toEqual([]);
    rows.forEach((row) => preserved(output, row, 'duplicate-id')); preserved(output, linked, 'owner-unresolved'); preserved(output, post, 'owner-unresolved');
  });
  it('retains raw legacy, preferences, support JSON, unknown root fragments and old review entries through serialization', () => {
    const fragments = { legacy: { original: [{ id: 'raw-legacy', extra: 'kept' }] }, preferences: { settings: [true, null] },
      supportMessages: [null, 1, 'message', { text: 'kept' }], unknownContext: { raw: ['kept'] } };
    for (const version of [1, 2]) {
      const prior = { path: 'prior-record', reason: 'invalid-record', original: { id: 'prior-source' } };
      const output = convert({ ...base(version), ...fragments, ...(version === 2 ? { migrationReview: [prior] } : {}) });
      expect(output.legacy).toEqual(fragments.legacy); expect(output.preferences).toEqual(fragments.preferences); expect(output.supportMessages).toEqual(fragments.supportMessages);
      preserved(output, fragments.unknownContext, 'unrecognized-field'); if (version === 2) expect(output.migrationReview).toContainEqual(prior);
    }
  });
  it('quarantines an explicit unknown application decision user without inventing a replacement', () => {
    const row = { id: 'application', ownerId: user.id, first: 'Synthetic', last: 'Applicant', email: 'synthetic@example.invalid', qualification: 'Synthetic',
      status: 'approved', submittedAt: 1, decidedBy: 'missing-user' };
    const output = convert({ ...base(), applications: [row] }); expect(output.applications).toEqual([]); preserved(output, row, 'broken-reference');
  });
  it('preserves notifications with nonexistent readBy user IDs instead of silently dropping read history', () => {
    const row = { id: 'notification', recipientId: 'all:student', content: 'Synthetic', createdAt: 1, readBy: ['missing-user'] };
    const output = convert({ ...base(), notifications: [row] }); expect(output.notifications).toEqual([]); preserved(output, row, 'broken-reference');
  });
  it('retains valid optional decision identities, read history and uninterpreted reference context', () => {
    const application = { id: 'application', ownerId: user.id, first: 'Synthetic', last: 'Applicant', email: 'synthetic@example.invalid', qualification: 'Synthetic', status: 'approved', submittedAt: 1, decidedBy: teacher.id };
    const notification = { id: 'notification', recipientId: 'all:student', content: 'Synthetic', createdAt: 1, readBy: [user.id], relatedEntityId: 'external-entity', relatedRoute: 'legacy-route' };
    const row = { ...submission, taskId: 'external-task' };
    const output = convert({ ...base(), applications: [application, { ...application, id: 'pending', decidedBy: null }], notifications: [notification], submissions: [row] });
    expect(output.applications).toHaveLength(2); expect(output.notifications).toEqual([notification]); expect(output.submissions[0].taskId).toBe('external-task'); expect(output.migrationReview).toEqual([]);
  });
});
