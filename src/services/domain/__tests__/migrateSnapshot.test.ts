import { describe, expect, it, vi } from 'vitest';
import { createEmptyAppData } from '../../demo/seedData';
import { migrateSnapshot } from '../migrateSnapshot';
import type { DomainSnapshot } from '../schema';

function migrated(input: unknown): DomainSnapshot {
  const result = migrateSnapshot(input);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
function legacy() {
  const data = createEmptyAppData();
  return { ...data, notes: [{ ...data.notes[0], ownerId: 's1' }, { ...data.notes[1], ownerId: 'sx1' }],
    studyPlan: { '2026-11-25': [
      { id: 1, ownerId: 's1', title: 'Reading for student A', skill: 'Reading', minutes: 20, done: false },
      { id: 2, ownerId: 'sx1', title: 'Listening for student B', skill: 'Listening', minutes: 15, done: true },
    ] } };
}
describe('staged schema migration — BU-002/026, NFR-05/21/25', () => {
  it('preserves explicit owners and existing stable IDs, converts numeric IDs deterministically', () => {
    const snapshot = migrated(legacy());
    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.revision).toBe(0);
    expect(snapshot.notes.map((item) => [item.id, item.ownerId])).toEqual([
      ['notes:legacy-number:1', 's1'], ['notes:legacy-number:2', 'sx1'],
    ]);
    expect(snapshot.studyPlan['2026-11-25'].map((item) => [item.id, item.ownerId])).toEqual([
      ['studyTask:legacy-number:1', 's1'], ['studyTask:legacy-number:2', 'sx1'],
    ]);
    expect(snapshot.practiceHistory[0]).toMatchObject({ id: 'p1', ownerId: 's1', userId: 's1' });
    expect(snapshot.forumPosts[0]).toMatchObject({ id: 'fp-demo-public', ownerId: 's1' });
    expect(snapshot.attempts).toEqual([]); // Never infer attempts from historical titles.
  });
  it('does not assign ownerless notes/plans to a seed account, even when only one account exists', () => {
    const input = createEmptyAppData();
    input.users = input.users.filter((user) => user.id === 's1');
    const before = JSON.stringify(input);
    const snapshot = migrated(input);
    expect(snapshot.notes).toEqual([]);
    expect(Object.values(snapshot.studyPlan).flat()).toEqual([]);
    expect(snapshot.migrationReview.filter((item) => item.reason === 'owner-unresolved')).toHaveLength(
      input.notes.length + Object.values(input.studyPlan).flat().length);
    expect(snapshot.migrationReview[0].original).toEqual(input.notes[0]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('is idempotent across JSON round-trip/refresh, preserving revisions, edits and review records', () => {
    const first = migrated(legacy());
    first.notes[0].meaning = 'Changed by owner';
    first.revision = 7;
    const second = migrated(JSON.parse(JSON.stringify(first)));
    expect(second).toEqual(first);
    expect(migrated(JSON.parse(JSON.stringify(second)))).toEqual(first);
  });
  it('preserves unresolved applications instead of treating an application ID or matching email as a user ID', () => {
    const input = { ...legacy(), applications: [{ id: 's1', first: 'Applicant', last: 'A', email: 'hien.phuong@example.com',
      qualification: 'Synthetic', status: 'pending', submittedAt: 1 }] };
    const snapshot = migrated(input);
    expect(snapshot.applications).toEqual([]);
    expect(snapshot.migrationReview).toContainEqual({ path: 'applications[0]', reason: 'owner-unresolved', original: input.applications[0] });
  });
  it('retains explicit teacher A/B grading ownership only when the related submission exists', () => {
    const input = { ...legacy(), submissions: [
      { id: 'sub-a', studentId: 's1', title: 'A', skill: 'Writing', visibility: 'TEACHER_ONLY', status: 'graded', createdAt: 1 },
      { id: 'sub-b', studentId: 'sx1', title: 'B', skill: 'Speaking', visibility: 'PUBLIC', status: 'graded', createdAt: 2 },
    ], grading: [
      { id: 'grade-a', teacherId: 'v1', submissionId: 'sub-a', bandScore: 7, feedback: 'A feedback', createdAt: 3, updatedAt: 3 },
      { id: 'grade-b', teacherId: 'v2', submissionId: 'sub-b', bandScore: 6, feedback: 'B feedback', createdAt: 4, updatedAt: 4 },
      { id: 'orphan-grade', teacherId: 'v1', submissionId: 'missing', bandScore: 6, feedback: 'Orphan', createdAt: 4, updatedAt: 4 },
    ] };
    const snapshot = migrated(input);
    expect(snapshot.grading.map((item) => [item.id, item.ownerId])).toEqual([['grade-a', 'v1'], ['grade-b', 'v2']]);
    expect(snapshot.migrationReview.some((item) => item.path === 'grading:orphan-grade')).toBe(true);
  });
  it('quarantines mismatched owners, invalid states, corrupt rows and duplicate IDs with original values', () => {
    const input = legacy();
    const snapshot = migrated({ ...input,
      notes: [...input.notes, { ...input.notes[0] }, null, { ...input.notes[1], id: 'bad-owner', ownerId: 'deleted-user' }],
      forumPosts: [ { ...input.forumPosts[0], visibility: 'private' }, { ...input.forumPosts[1], ownerId: 'sx1' } ],
      studyPlan: { invalidDay: 'broken', '2026-11-25': [{ ...input.studyPlan['2026-11-25'][0], done: 'yes' }] },
    });
    expect(snapshot.notes).toHaveLength(1);
    expect(snapshot.notes[0].ownerId).toBe('sx1');
    expect(snapshot.forumPosts).toEqual([]);
    expect(snapshot.migrationReview.filter((item) => item.reason === 'duplicate-id')).toHaveLength(2);
    expect(snapshot.migrationReview.some((item) => item.original === null)).toBe(true);
    expect(migrated(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });
  it('never seeds or touches storage, including denied storage', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      expect(migrateSnapshot(legacy()).ok).toBe(true);
      expect(get).not.toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    } finally { get.mockRestore(); set.mockRestore(); }
  });
  it.each([null, '{invalid', {}, { ...legacy(), schemaVersion: 99 }, { ...legacy(), notes: null },
    { ...legacy(), schemaVersion: 2, revision: -1 }, { ...legacy(), users: [{ password: 'not-to-be-copied' }] }])(
    'reports malformed/unsupported input without returning a successful snapshot (%#)', (input) => {
      expect(migrateSnapshot(input)).toMatchObject({ ok: false, error: { retryable: false } });
    });
  it('does not introduce synthetic rows into an existing empty account dataset', () => {
    const input = { ...legacy(), users: [], questionBank: [], notifications: [], notes: [], studyPlan: {}, practiceHistory: [], forumPosts: [] };
    const snapshot = migrated(input);
    expect(snapshot.users).toEqual([]);
    expect(snapshot.notes).toEqual([]);
    expect(snapshot.questionBank).toEqual([]);
  });
});
