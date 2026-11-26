import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../demo/seedData';
import { migrateSnapshot } from '../migrateSnapshot';
import type { DomainSnapshot } from '../schema';

function base() {
  return { ...createEmptyAppData(), notes: [], studyPlan: {}, practiceHistory: [], submissions: [], grading: [],
    forumTopics: [], forumPosts: [], forumComments: [], forumReports: [], applications: [], registrations: [], notifications: [],
    questionBank: [{ id: 'qa-set', title: 'Synthetic Reading', skill: 'Reading', status: 'Published', sections: [
      { id: 'section-1', title: 'Section 1', instructions: 'Read.', groups: [
        { id: 'group-1', type: 'Multiple Choice', startQuestionNumber: 1, questions: [
          { id: 'q1', number: 1, prompt: 'Question one', options: ['A', 'B'], answerKey: 'A', acceptedAnswers: ['A'], explanation: 'Synthetic answer' },
        ] },
      ] },
    ] }], legacy: {}, preferences: {}, supportMessages: [] };
}
function migrated(input: unknown): DomainSnapshot {
  const before = JSON.stringify(input);
  const result = migrateSnapshot(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
function roundTrip(value: DomainSnapshot) {
  expect(migrated(JSON.parse(JSON.stringify(value)))).toEqual(value);
  expect(migrated(JSON.parse(JSON.stringify(value)))).toEqual(value);
}
const task = { id: 'original-task', ownerId: 's1', title: 'Owned Reading', skill: 'Reading', minutes: 10, done: false };
function attempt(overrides: Record<string, unknown> = {}) {
  return { id: 'qa-attempt', userId: 's1', ownerId: 's1', questionSetId: 'qa-set', skill: 'Reading',
    status: 'in_progress', stage: 'Reading', startedAt: 1, answers: [], flaggedQuestionIds: [], ...overrides };
}
function withAttempts(rows: unknown[]) { return { ...base(), schemaVersion: 2, revision: 5, migrationReview: [], attempts: rows }; }

describe('FIX-01A-02 study-plan preservation — Q13, BU-026', () => {
  it.each(['not-a-date', '2026-02-30', '2026-13-01', '__proto__', 'constructor', 'prototype'])('preserves the original populated group for invalid key %s', (key) => {
    const input = { ...base(), studyPlan: JSON.parse(`{"${key}":[${JSON.stringify(task)}]}`) };
    const before = JSON.stringify(input);
    const output = migrated(input);
    expect(Object.values(output.studyPlan).flat()).toEqual([]);
    expect(output.migrationReview).toContainEqual(expect.objectContaining({ path: `studyPlan.${key}`, reason: 'invalid-group-key', original: [task] }));
    expect(JSON.stringify(input)).toBe(before);
    expect(migrated(input)).toEqual(output);
    roundTrip(output);
  });
  it('preserves valid date groups and IDs/owners alongside unsafe groups through serialized repeat migration', () => {
    const plan = JSON.parse(`{"2024-02-29":[${JSON.stringify(task)}],"__proto__":[${JSON.stringify({ ...task, id: 'unsafe-task', ownerId: 'sx1' })}],"constructor":[null],"2026-11-25":[]}`);
    const output = migrated({ ...base(), studyPlan: plan });
    expect(output.studyPlan['2024-02-29']).toEqual([task]);
    expect(output.studyPlan['2026-11-25']).toEqual([]);
    expect(Object.getPrototypeOf(output.studyPlan)).toBe(Object.prototype);
    expect(output.migrationReview.map((r) => r.original)).toEqual([plan.__proto__, plan.constructor]);
    roundTrip(output);
  });
});

describe('FIX-01A-03 nested typed data — Q15', () => {
  it.each([{ sections: [null] }, { sections: [{}] }, { sections: [{ id: 's', title: 'Section', groups: [null] }] },
    { sections: [{ id: 's', title: 'Section', groups: [{ id: 'g', type: 'Multiple Choice', startQuestionNumber: 1, questions: [{}] }] }] }])(
    'preserves malformed sections instead of returning active typed content (%#)', ({ sections }) => {
      const input = base(); const original = { ...input.questionBank[0], sections };
      const output = migrated({ ...input, questionBank: [original] });
      expect(output.questionBank).toEqual([]);
      expect(output.migrationReview).toContainEqual(expect.objectContaining({ path: 'questionBank[0]', reason: 'invalid-nested-data', original }));
      roundTrip(output);
    });
  it.each([{ shortName: { wrong: true } }, { joinedAt: 'yesterday' }, { details: [] }, { label: null }])(
    'preserves the invalid original profile record (%#)', (profile) => {
      const input = base(); const original = { ...input.users[0], profile };
      const output = migrated({ ...input, users: [original] });
      expect(output.users).toEqual([]);
      expect(output.migrationReview).toContainEqual(expect.objectContaining({ path: 'users[0]', reason: 'invalid-nested-data', original }));
      roundTrip(output);
    });
  it('keeps valid legacy optional fields, nested structures and JSON extension fields unchanged', () => {
    const input = base();
    const user = { ...input.users[0], profile: { shortName: 'QA', label: 'Learner', joinedAt: 1,
      details: { flags: [true, null, { nested: 'value' }] }, custom: { retained: [1, 'two'] } } };
    const output = migrated({ ...input, users: [user], questionBank: [...input.questionBank,
      { id: 'legacy-content', title: 'Metadata only', skill: 'Writing', status: 'Archived' }] });
    expect(output.users).toEqual([user]);
    expect(output.questionBank[0]).toEqual(input.questionBank[0]);
    expect(output.questionBank[1]).not.toHaveProperty('sections');
    expect(output.migrationReview).toEqual([]);
    roundTrip(output);
  });
  it('quarantines invalid collection entries without losing valid siblings', () => {
    const input = base(); const output = migrated({ ...input, questionBank: [null, input.questionBank[0], 42] });
    expect(output.questionBank).toEqual(input.questionBank);
    expect(output.migrationReview.map((r) => r.original)).toEqual([null, 42]);
    roundTrip(output);
  });
  it.each(['extraSourceContext', 'revision', 'migrationReview'])('preserves unexpected v1 %s rather than silently dropping recovery context', (path) => {
    const original = { sourceVersion: 'legacy-fixture', originalIds: ['retained'] };
    const output = migrated({ ...base(), [path]: original });
    expect(output.migrationReview).toContainEqual({ path, reason: 'unrecognized-field', original });
    roundTrip(output);
  });
  it('does not activate content with ambiguous duplicate nested question IDs', () => {
    const input = base(); const group = input.questionBank[0].sections[0].groups[0];
    group.questions.push({ ...group.questions[0], prompt: 'Conflicting source question' });
    const output = migrated(input);
    expect(output.questionBank).toEqual([]);
    expect(output.migrationReview).toContainEqual(expect.objectContaining({ reason: 'duplicate-id', original: input.questionBank[0] }));
    roundTrip(output);
  });
});

describe('FIX-01A-04 relationships/state — Q14, BU-004/026, NFR-25', () => {
  const post = { id: 'post-1', authorId: 's1', title: 'Synthetic', body: 'Body', tags: [], visibility: 'PUBLIC', status: 'published' };
  const comment = { id: 'comment-1', authorId: 'sx1', postId: 'post-1', body: 'Reply' };
  const report = { id: 'report-1', reporterId: 'v1', postId: 'post-1', reason: 'Synthetic', detail: 'Review', status: 'open' };
  it('retains valid linked comments/reports, a draft attempt and a finalized result', () => {
    const draft = attempt({ answers: [{ questionId: 'q1', value: ['A'], updatedAt: 1 }] });
    const completed = attempt({ id: 'finished', status: 'completed', stage: 'Completed', submittedAt: 2,
      result: { score: 1, correct: 1, incorrect: 0, unanswered: 0 } });
    const output = migrated({ ...withAttempts([draft, completed]), forumPosts: [post], forumComments: [comment], forumReports: [report] });
    expect(output.forumComments).toEqual([comment]); expect(output.forumReports).toEqual([report]);
    expect(output.attempts).toEqual([draft, completed]); expect(output.migrationReview).toEqual([]);
    roundTrip(output);
  });
  it.each(['missing', 'deleted'])('preserves comments with %s post references outside active records', (state) => {
    const output = migrated({ ...base(), forumPosts: state === 'deleted' ? [{ ...post, status: 'deleted' }] : [], forumComments: [comment] });
    expect(output.forumComments).toEqual([]);
    expect(output.migrationReview).toContainEqual(expect.objectContaining({ reason: 'broken-reference', original: comment }));
    roundTrip(output);
  });
  it.each([{ ...report, postId: 'missing' }, { ...report, reporterId: 'missing' }, { ...comment, authorId: 'missing' }])(
    'preserves orphan report/user references (%#)', (row) => {
      const key = 'reporterId' in row ? 'forumReports' : 'forumComments';
      const output = migrated({ ...base(), forumPosts: [post], [key]: [row] });
      expect(output[key]).toEqual([]);
      expect(output.migrationReview).toContainEqual(expect.objectContaining({ reason: 'broken-reference', original: row }));
      roundTrip(output);
    });
  it.each([
    attempt({ questionSetId: 'deleted-set', status: 'completed', stage: 'Completed', result: { correct: 0 } }),
    attempt({ status: 'completed', stage: 'Completed' }),
    attempt({ status: 'completed', stage: 'Completed', result: {} }),
    attempt({ status: 'completed', stage: 'Completed', result: { skillScores: {} } }),
    attempt({ status: 'completed', stage: 'Speaking', result: { correct: 1 } }),
    attempt({ answers: [{ questionId: 'q1', value: 'A', updatedAt: 1 }, { questionId: 'q1', value: 'B', updatedAt: 2 }] }),
    attempt({ answers: [{ questionId: 'deleted-question', value: 'A', updatedAt: 1 }] }),
  ])('preserves invalid attempt original rather than guessing result/answers (%#)', (row) => {
    const output = migrated(withAttempts([row]));
    expect(output.attempts).toEqual([]);
    expect(output.migrationReview).toContainEqual(expect.objectContaining({ path: 'attempts[0]', original: row }));
    roundTrip(output);
  });
  it('retains supported historical references without inventing deleted content snapshots', () => {
    const oldResult = attempt({ status: 'completed', stage: 'Completed', result: { correct: 0 } });
    const input = withAttempts([oldResult]); input.questionBank[0].status = 'Archived';
    const output = migrated({ ...input, forumPosts: [{ ...post, status: 'deleted' }], forumReports: [{ ...report, status: 'resolved' }] });
    expect(output.attempts).toEqual([oldResult]);
    expect(output.forumReports).toEqual([{ ...report, status: 'resolved' }]);
    expect(output.forumPosts[0].status).toBe('deleted'); expect(output.migrationReview).toEqual([]);
    roundTrip(output);
  });
  it('preserves missing, cyclic and cross-post reply chains without activating dependent comments', () => {
    const rows = [
      { ...comment, id: 'missing-parent', parentId: 'missing' },
      { ...comment, id: 'dependent-child', parentId: 'missing-parent' },
      { ...comment, id: 'cycle-a', parentId: 'cycle-b' }, { ...comment, id: 'cycle-b', parentId: 'cycle-a' },
      { ...comment, id: 'other-post', postId: 'post-2' }, { ...comment, id: 'cross-post', parentId: 'other-post' },
    ];
    const output = migrated({ ...base(), forumPosts: [post, { ...post, id: 'post-2' }], forumComments: rows });
    expect(output.forumComments).toEqual([rows[4]]);
    expect(output.migrationReview.map((r) => r.original)).toEqual(rows.filter((row) => row.id !== 'other-post'));
    roundTrip(output);
  });
  it('keeps valid reply chains and quarantines broken explicit post relationships with original IDs', () => {
    const bad = { ...post, id: 'bad-link', submissionId: 'missing-submission' };
    const badTopic = { ...post, id: 'bad-topic', topicId: 'missing-topic' };
    const output = migrated({ ...base(), forumPosts: [post, bad, badTopic], forumComments: [comment, { ...comment, id: 'child', parentId: comment.id }] });
    expect(output.forumPosts.map((row) => row.id)).toEqual([post.id]);
    expect(output.forumComments).toHaveLength(2);
    expect(output.migrationReview.map((r) => r.original)).toEqual([bad, badTopic]);
    roundTrip(output);
  });
  it.each([
    attempt({ stage: 'Completed' }), attempt({ remainingSeconds: -1 }), attempt({ submittedAt: 0 }),
    attempt({ stage: 'Speaking' }), attempt({ flaggedQuestionIds: ['missing-question'] }),
  ])('quarantines inconsistent draft stage/time/question references (%#)', (row) => {
    const output = migrated(withAttempts([row]));
    expect(output.attempts).toEqual([]);
    expect(output.migrationReview).toContainEqual(expect.objectContaining({ original: row }));
    roundTrip(output);
  });
});
