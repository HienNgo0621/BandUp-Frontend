import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { failure, type DomainRepositories, type Principal, type Result } from '../../domain/contracts';
import { migrateSnapshot } from '../../domain/migrateSnapshot';
import type { DomainSnapshot } from '../../domain/schema';
import { createSnapshotPersistence, SNAPSHOT_KEYS } from '../../storage/snapshotPersistence';
import { createMockRepositories, type MockRepositoryOptions } from '../mockRepositories';
import { createRepositoryFixture } from '../mockFixtures';
import { selectRepositories } from '../provider';

const student = (suffix = 'a'): Principal => ({ userId: `fixture:student:${suffix}`, role: 'student' });
const teacher = (suffix = 'a'): Principal => ({ userId: `fixture:teacher:${suffix}`, role: 'teacher' });
const admin: Principal = { userId: 'fixture:admin', role: 'admin' };
const write = (revision = 0) => ({ expectedRevision: revision, operationId: `test-operation:${revision}` });
function value<T>(result: Result<T>): T { expect(result.ok).toBe(true); if (!result.ok) throw new Error(result.error.code); return result.value; }
class Memory {
  data = new Map<string, string>(); writes = 0; failWrite = false;
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, raw: string) { if (this.failWrite) throw new Error('Synthetic private diagnostic'); this.writes++; this.data.set(key, raw); }
  removeItem(key: string) { this.data.delete(key); }
}
function setup(p: Principal | null = student(), source: DomainSnapshot | null = createRepositoryFixture()) {
  const memory = new Memory(); if (source) memory.data.set(SNAPSHOT_KEYS.canonical, JSON.stringify(source));
  let current = p;
  const storage = createSnapshotPersistence({ storage: () => memory, digest: async (raw) => createHash('sha256').update(raw).digest('hex') });
  const options: MockRepositoryOptions = { storage, resolvePrincipal: () => current };
  return { memory, storage, options, repos: createMockRepositories(options), switchTo: (next: Principal | null) => { current = next; } };
}

describe('mock provider boundary and reads - BU-026, NFR-05/21, Q17', () => {
  it('uses deterministic distinct synthetic owners with no credentials or migration review', () => {
    const fixture = createRepositoryFixture(); expect(fixture).toEqual(createRepositoryFixture());
    const parsed = value(migrateSnapshot(fixture)); expect(parsed).toEqual(fixture); expect(parsed.migrationReview).toEqual([]);
    expect(fixture.notes[0].ownerId).not.toBe(fixture.notes[1].ownerId); expect(fixture.notes[0].meaning).not.toBe(fixture.notes[1].meaning);
    expect(fixture.grading[0].ownerId).not.toBe(fixture.grading[1].ownerId); expect(JSON.stringify(fixture)).not.toMatch(/password|accessToken/);
  });
  it('construction has no reads, seeding, migration or writable snapshot facade', () => {
    const read = vi.fn(); const compareAndSwap = vi.fn();
    const repos = createMockRepositories({ resolvePrincipal: () => null, storage: { read, compareAndSwap, subscribe: () => () => undefined } });
    expect(read).not.toHaveBeenCalled(); expect(compareAndSwap).not.toHaveBeenCalled();
    expect(Object.keys(repos).sort()).toEqual(['applications', 'attempts', 'content', 'forum', 'grading', 'learning', 'notifications', 'subscribe', 'users']);
    expect(repos).not.toHaveProperty('storage'); expect(repos).not.toHaveProperty('read');
  });
  it('returns a detached allowlisted account and content summary, not credential/profile/extensions or answer keys', async () => {
    const source = createRepositoryFixture(); source.users[0].profile = { shortName: 'A', passwordHash: 'synthetic-private', details: { privateMetadata: 'do not expose' } };
    Object.assign(source.users[0], { extension: 'private-extra' });
    Object.assign(source.questionBank[0], { answerKey: 'top-level answer', privateMetadata: 'internal' });
    source.migrationReview.push({ path: 'private-source', reason: 'owner-unresolved', original: { privateSource: 'hidden' } });
    const { repos, memory } = setup(student(), source); const before = memory.getItem(SNAPSHOT_KEYS.canonical);
    const account = value(await repos.users.me()); expect(account.profile?.shortName).toBe('A');
    expect(JSON.stringify(account)).not.toMatch(/synthetic-private|privateMetadata|details|passwordHash|extension/);
    const content = value(await repos.content.published()); expect(content).toHaveLength(1);
    expect(content[0]).not.toHaveProperty('sections'); expect(JSON.stringify(content)).not.toMatch(/answerKey|privateMetadata|synthetic answer/);
    account.name = 'Caller mutation'; expect(value(await repos.users.me()).name).toBe(source.users[0].name);
    expect(memory.getItem(SNAPSHOT_KEYS.canonical)).toBe(before); expect(memory.writes).toBe(0);
  });
  it('switches two learners and refreshes without cross-owner notes, plan, history or attempts', async () => {
    const { repos, switchTo, options } = setup();
    for (const suffix of ['a', 'b', 'a']) {
      switchTo(student(suffix)); expect(value(await repos.learning.notes()).map((n) => n.id)).toEqual([`fixture:note:${suffix}`]);
      expect(Object.values(value(await repos.learning.plan())).flat().map((t) => t.ownerId)).toEqual([student(suffix).userId]);
      expect(value(await repos.learning.history()).map((h) => h.userId)).toEqual([student(suffix).userId]);
      expect(value(await repos.attempts.get(`fixture:attempt:${suffix}`)).ownerId).toBe(student(suffix).userId);
      expect(await repos.attempts.get(`fixture:attempt:${suffix === 'a' ? 'b' : 'a'}`)).toMatchObject({ ok: false, error: { code: 'not-found' } });
      expect(value(await createMockRepositories(options).learning.notes()).map((n) => n.id)).toEqual([`fixture:note:${suffix}`]);
    }
  });
  it('keeps teacher A/B grading distinct and permits learners to read all grades on their own submission', async () => {
    const { repos, switchTo } = setup(teacher());
    for (const suffix of ['a', 'b']) {
      switchTo(teacher(suffix)); expect(value(await repos.grading.mine()).map((g) => g.teacherId)).toEqual([teacher(suffix).userId]);
      expect(value(await repos.grading.forSubmission('fixture:submission:a')).map((g) => g.teacherId)).toEqual([teacher(suffix).userId]);
    }
    switchTo(student()); expect(value(await repos.grading.forSubmission('fixture:submission:a'))).toHaveLength(2);
    switchTo(student('b')); expect(await repos.grading.forSubmission('fixture:submission:a')).toMatchObject({ ok: false, error: { code: 'not-found' } });
    switchTo(admin); expect(await repos.grading.mine()).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
  it('denies teacher access to grades through another learner private submission', async () => {
    const source = createRepositoryFixture(); source.submissions[0].visibility = 'ONLY_ME'; const { repos } = setup(teacher(), source);
    expect(await repos.grading.forSubmission('fixture:submission:a')).toMatchObject({ ok: false, error: { code: 'not-found' } });
  });
  it('preserves valid empty/deleted collections on repeat reads and provider recreation without seed restoration', async () => {
    const source = createRepositoryFixture(); source.notes = []; source.studyPlan = {}; source.practiceHistory = []; source.attempts = []; source.questionBank = [];
    const { repos, options, memory } = setup(student(), source);
    for (const provider of [repos, createMockRepositories(options)]) {
      expect(value(await provider.learning.notes())).toEqual([]); expect(value(await provider.learning.plan())).toEqual({});
      expect(value(await provider.learning.history())).toEqual([]); expect(value(await provider.content.published())).toEqual([]);
    }
    expect(memory.writes).toBe(0);
  });
  it.each([null, { userId: 'missing', role: 'student' }, { userId: 'fixture:student:a', role: 'admin' }])('rejects unauthenticated or forged identity %j', async (p) => {
    const { repos, memory } = setup(p as Principal | null);
    expect((await repos.learning.notes()).ok).toBe(false); expect((await repos.learning.setTaskDone('fixture:task:a', true, write())).ok).toBe(false);
    expect(memory.writes).toBe(0);
  });
  it.each(['blocked', 'pending', 'unknown'] as const)('rejects stored account status %s', async (status) => {
    const source = createRepositoryFixture(); source.users[0].status = status; const { repos } = setup(student(), source);
    expect(await repos.users.me()).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
  it('allows muted users non-Forum personal reads and rejects a throwing principal resolver', async () => {
    const source = createRepositoryFixture(); source.users[0].status = 'muted'; const { repos, options } = setup(student(), source);
    expect(value(await repos.learning.notes())).toHaveLength(1);
    const failed = createMockRepositories({ ...options, resolvePrincipal: () => { throw new Error('Synthetic private diagnostic'); } });
    expect(await failed.users.me()).toEqual(failure('unauthenticated', 'Please sign in to continue.'));
  });
  it('rejects an account switch while storage is being read', async () => {
    const { storage, options, switchTo } = setup();
    const read = async () => { const result = await storage.read(); switchTo(student('b')); return result; };
    const repos = createMockRepositories({ ...options, storage: { ...storage, read } });
    expect(await repos.learning.notes()).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });
  it.each(['corrupt', 'v1', 'absent', 'future'] as const)('does not repair/migrate/reseed %s storage through a repository', async (kind) => {
    const { memory, repos } = setup();
    if (kind === 'corrupt') memory.data.set(SNAPSHOT_KEYS.canonical, '{broken');
    if (kind === 'absent') memory.removeItem(SNAPSHOT_KEYS.canonical);
    if (kind === 'future') memory.data.set(SNAPSHOT_KEYS.canonical, '{"schemaVersion":100}');
    if (kind === 'v1') { const { revision: _revision, attempts: _attempts, migrationReview: _review, ...legacy } = createRepositoryFixture(); memory.data.set(SNAPSHOT_KEYS.canonical, JSON.stringify({ ...legacy, schemaVersion: 1 })); }
    const before = memory.getItem(SNAPSHOT_KEYS.canonical); expect((await repos.users.me()).ok).toBe(false);
    expect(memory.getItem(SNAPSHOT_KEYS.canonical)).toBe(before); expect(memory.writes).toBe(0);
  });
  it('validates untrusted storage implementations rather than trusting typed casts', async () => {
    const { options } = setup(); const repos = createMockRepositories({ ...options, storage: { ...options.storage, read: async () => ({ ok: true, value: { schemaVersion: 2, users: [null] } }) } });
    expect((await repos.content.published()).ok).toBe(false);
  });
  it.each(['users.me', 'learning.notes', 'forum.list'] as const)('injects deterministic typed failure for %s without writes', async (operation) => {
    const { options, memory } = setup(); const repos = createMockRepositories({ ...options, failures: { [operation]: 'storage-read-failed' } });
    const result = await (operation === 'users.me' ? repos.users.me() : operation === 'learning.notes' ? repos.learning.notes() : repos.forum.list());
    expect(result).toMatchObject({ ok: false, error: { code: 'storage-read-failed' } }); expect(memory.writes).toBe(0);
  });
});

describe('centralized Forum policy in repositories - FR-31/32/68/72', () => {
  it.each([
    [null, ['public']], [student(), ['public', 'private']], [student('b'), ['public', 'teacher']],
    [teacher(), ['public', 'teacher']], [teacher('b'), ['public', 'teacher']], [admin, ['public']],
  ] as const)('filters list AND direct detail for %j', async (principal, suffixes) => {
    const { repos } = setup(principal); const ids = suffixes.map((s) => `fixture:post:${s}`);
    expect(value(await repos.forum.list()).map((p) => p.id)).toEqual(ids);
    for (const suffix of ['public', 'private', 'teacher']) {
      const result = await repos.forum.get(`fixture:post:${suffix}`); expect(result.ok).toBe(ids.includes(`fixture:post:${suffix}`));
      if (!result.ok) expect(JSON.stringify(result)).not.toMatch(/Private synthetic title|Private synthetic content|Teacher feedback request/);
    }
  });
  it.each(['draft', 'hidden', 'deleted'] as const)('does not publish %s posts even for Admin', async (status) => {
    const source = createRepositoryFixture(); source.forumPosts[0].status = status;
    const { repos } = setup(admin, source); expect(value(await repos.forum.list())).toEqual([]);
    expect((await repos.forum.get('fixture:post:public')).ok).toBe(false);
  });
});

describe('supported mock writes - revisions, errors, ownership and no false success', () => {
  it('updates only the current account name; persists through a new provider and emits one invalidation', async () => {
    const { repos, options, memory } = setup(); const event = vi.fn(); const stop = repos.subscribe(event);
    const result = value(await repos.users.updateProfile({ name: '  Updated learner  ' }, write()));
    expect(result.revision).toBe(1); expect(result.value.name).toBe('Updated learner'); expect(event).toHaveBeenCalledTimes(1);
    expect(value(await createMockRepositories(options).users.me()).name).toBe('Updated learner');
    const saved = JSON.parse(memory.getItem(SNAPSHOT_KEYS.canonical)!); expect(saved.users[1].name).toBe('Synthetic learner B');
    stop(); value(await repos.users.updateProfile({ name: 'Another name' }, write(1))); expect(event).toHaveBeenCalledTimes(1);
  });
  it.each([{ name: '' }, { name: '   ' }, { name: 'Allowed', role: 'admin' }, { name: 'Allowed', ownerId: 'fixture:student:b' }])('rejects invalid/forged profile input %j', async (input) => {
    const { repos, memory } = setup(); expect(await repos.users.updateProfile(input, write())).toMatchObject({ ok: false, error: { code: 'validation' } }); expect(memory.writes).toBe(0);
  });
  it('changes own task, leaves other owner untouched, and returns a no-op without revision/event', async () => {
    const { repos, memory } = setup(); const event = vi.fn(); repos.subscribe(event);
    expect(value(await repos.learning.setTaskDone('fixture:task:a', true, write())).value.done).toBe(true);
    const writes = memory.writes; expect(value(await repos.learning.setTaskDone('fixture:task:a', true, write(1))).revision).toBe(1);
    expect(memory.writes).toBe(writes); expect(event).toHaveBeenCalledTimes(1);
    expect(await repos.learning.setTaskDone('fixture:task:b', true, write(1))).toMatchObject({ ok: false, error: { code: 'not-found' } });
    expect(JSON.parse(memory.getItem(SNAPSHOT_KEYS.canonical)!).studyPlan['2026-11-27'][1].done).toBe(false);
  });
  it.each([teacher(), admin, null])('rejects unauthorized task mutation %j', async (p) => {
    const { repos, memory } = setup(p); expect((await repos.learning.setTaskDone('fixture:task:a', true, write())).ok).toBe(false); expect(memory.writes).toBe(0);
  });
  it('limits notification reads/marks to recipient or exact role and isolates broadcast read state', async () => {
    const { repos, switchTo, memory } = setup(); const events = vi.fn(); repos.subscribe(events);
    expect(value(await repos.notifications.mine()).map((n) => n.id)).toEqual(['fixture:notification:a', 'fixture:notification:students']);
    expect((await repos.notifications.markRead('fixture:notification:b', write())).ok).toBe(false);
    expect(value(await repos.notifications.markAllRead(write())).value).toBe(2);
    expect(value(await repos.notifications.markAllRead(write(1)))).toEqual({ value: 0, revision: 1 }); expect(events).toHaveBeenCalledTimes(1);
    switchTo(student('b')); const b = value(await repos.notifications.mine()); expect(b.every((n) => n.readBy.length === 0)).toBe(true);
    expect(value(await repos.notifications.markRead('fixture:notification:students', write(1))).revision).toBe(2);
    const saved = JSON.parse(memory.getItem(SNAPSHOT_KEYS.canonical)!); expect(saved.notifications[2].readBy).toEqual([student().userId, student('b').userId]);
    switchTo(teacher()); expect(value(await repos.notifications.mine())).toEqual([]);
  });
  it.each(['storage-write-failed', 'conflict'] as const)('propagates %s without business success or invalidation', async (code) => {
    const { options, memory } = setup(); const repos = createMockRepositories({ ...options, storage: { ...options.storage, compareAndSwap: async () => failure(code, 'Saving could not be completed.') } });
    const event = vi.fn(); repos.subscribe(event); const before = memory.getItem(SNAPSHOT_KEYS.canonical);
    expect(await repos.learning.setTaskDone('fixture:task:a', true, write())).toMatchObject({ ok: false, error: { code } });
    expect(memory.getItem(SNAPSHOT_KEYS.canonical)).toBe(before); expect(event).not.toHaveBeenCalled();
  });
  it('uses real injected storage failures, preserves canonical and emits no commit', async () => {
    const { repos, memory } = setup(); const before = memory.getItem(SNAPSHOT_KEYS.canonical); memory.failWrite = true; const listener = vi.fn(); repos.subscribe(listener);
    expect(await repos.users.updateProfile({ name: 'Changed' }, write())).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(memory.getItem(SNAPSHOT_KEYS.canonical)).toBe(before); expect(listener).not.toHaveBeenCalled();
  });
  it('rejects stale revisions and malformed write options without touching persisted state', async () => {
    const { repos, memory } = setup(); value(await repos.users.updateProfile({ name: 'Changed' }, write())); const before = memory.getItem(SNAPSHOT_KEYS.canonical);
    expect(await repos.learning.setTaskDone('fixture:task:a', true, write())).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await repos.notifications.markAllRead({ expectedRevision: 1, operationId: '' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(memory.getItem(SNAPSHOT_KEYS.canonical)).toBe(before);
  });
  it('catches throwing storage adapters without exposing diagnostic payloads', async () => {
    const { options } = setup(); const repos = createMockRepositories({ ...options, storage: { ...options.storage, read: async () => { throw new Error('PRIVATE'); } } });
    expect(await repos.users.me()).toEqual(failure('storage-read-failed', 'Your saved data could not be read. Please try again.', true));
  });
  it('sanitizes structured storage errors while preserving their code and retryability', async () => {
    const { options } = setup(); const failedRead = createMockRepositories({ ...options,
      storage: { ...options.storage, read: async () => failure('storage-read-failed', 'PRIVATE persisted payload', true) } });
    const read = await failedRead.users.me(); expect(read).toMatchObject({ ok: false, error: { code: 'storage-read-failed', retryable: true } });
    expect(JSON.stringify(read)).not.toContain('PRIVATE');
    const failedWrite = createMockRepositories({ ...options,
      storage: { ...options.storage, compareAndSwap: async () => failure('storage-write-failed', 'PRIVATE failed payload', true) } });
    const writeResult = await failedWrite.users.updateProfile({ name: 'Updated' }, write());
    expect(writeResult).toMatchObject({ ok: false, error: { code: 'storage-write-failed', retryable: true } }); expect(JSON.stringify(writeResult)).not.toContain('PRIVATE');
  });
  it('rejects accessor-based input/options without executing them or throwing private diagnostics', async () => {
    const { repos, memory } = setup(); const getter = vi.fn(() => { throw new Error('PRIVATE'); });
    const input = { name: 'Synthetic' }; Object.defineProperty(input, 'name', { get: getter, enumerable: true });
    expect(await repos.users.updateProfile(input, write())).toMatchObject({ ok: false, error: { code: 'validation' } });
    const options = write(); Object.defineProperty(options, 'expectedRevision', { get: getter, enumerable: true });
    expect(await repos.learning.setTaskDone('fixture:task:a', true, options)).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(getter).not.toHaveBeenCalled(); expect(memory.writes).toBe(0);
  });
  it('rechecks account identity before a write, not just the earlier read', async () => {
    const { options, memory } = setup(); let calls = 0;
    const repos = createMockRepositories({ ...options, resolvePrincipal: () => ++calls < 3 ? student() : student('b') });
    expect(await repos.learning.setTaskDone('fixture:task:a', true, write())).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(memory.writes).toBe(0);
  });
  it('sanitizes throwing writes and allows an isolated configured write failure', async () => {
    const { options, memory } = setup(); const throwing = createMockRepositories({ ...options,
      storage: { ...options.storage, compareAndSwap: async () => { throw new Error('PRIVATE'); } } });
    expect(await throwing.users.updateProfile({ name: 'Changed' }, write())).toEqual(failure('storage-write-failed', 'Your changes could not be saved. Please try again.', true));
    const configured = createMockRepositories({ ...options, failures: { 'notifications.markRead': 'storage-write-failed' } });
    expect(await configured.notifications.markRead('fixture:notification:a', write())).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(memory.writes).toBe(0);
  });
  it.each(['', 'missing'])('returns typed validation/not-found for task and attempt %j', async (id) => {
    const { repos } = setup(); for (const result of [await repos.attempts.get(id), await repos.learning.setTaskDone(id, true, write())])
      expect(result).toMatchObject({ ok: false, error: { code: id ? 'not-found' : 'validation' } });
  });
});

describe('deferred methods and composition', () => {
  const deferred: [string, Principal, (r: DomainRepositories) => Promise<Result<unknown>>][] = [
    ['status', admin, (r) => r.users.setStatus('fixture:student:a', 'blocked', write())],
    ['answers', student(), (r) => r.attempts.saveAnswers('fixture:attempt:a', [], write())],
    ['submit', student(), (r) => r.attempts.submit('fixture:attempt:a', write())],
    ['visibility', student(), (r) => r.forum.setVisibility('fixture:post:private', 'PUBLIC', write())],
    ['application list', admin, (r) => r.applications.pendingReview()],
    ['application decision', admin, (r) => r.applications.decide('missing', 'approved', 'Synthetic decision', write())],
  ];
  it.each(deferred)('%s truthfully returns unsupported with no writes or events', async (_name, p, operation) => {
    const { repos, memory } = setup(p); const listener = vi.fn(); repos.subscribe(listener);
    expect(await operation(repos)).toMatchObject({ ok: false, error: { code: 'unsupported' } }); expect(memory.writes).toBe(0); expect(listener).not.toHaveBeenCalled();
  });
  it('does not let unsupported methods bypass ownership or role checks', async () => {
    const { repos } = setup();
    expect(await repos.attempts.submit('fixture:attempt:b', write())).toMatchObject({ ok: false, error: { code: 'not-found' } });
    expect(await repos.forum.setVisibility('fixture:post:teacher', 'PUBLIC', write())).toMatchObject({ ok: false, error: { code: 'not-found' } });
    expect(await repos.applications.pendingReview()).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
  it('selects mock or an explicitly supplied future API adapter without a global switch or endpoint invention', async () => {
    const { options } = setup(); const repos = value(selectRepositories({ kind: 'mock', options })); expect(value(await repos.users.me()).id).toBe(student().userId);
    const transport = { request: vi.fn() }; expect(selectRepositories({ kind: 'express', transport })).toMatchObject({ ok: false, error: { code: 'unsupported' } });
    const connect = vi.fn(() => ({ ok: true as const, value: repos })); expect(value(selectRepositories({ kind: 'express', transport, connect }))).toBe(repos);
    expect(connect).toHaveBeenCalledWith(transport); expect(transport.request).not.toHaveBeenCalled();
    expect(selectRepositories({ kind: 'express', transport, connect: () => { throw new Error('PRIVATE'); } })).toMatchObject({ ok: false, error: { code: 'not-ready' } });
  });
  it('leaves normal runtime contexts, loaders and auth disconnected from the staged foundation', () => {
    for (const file of ['src/contexts/AppDataContext.tsx', 'src/contexts/AuthContext.tsx', 'src/services/appDataService.ts', 'src/services/auth/authService.ts', 'src/App.tsx']) {
      const source = readFileSync(file, 'utf8'); expect(source).not.toMatch(/mockRepositories|snapshotPersistence|repositories\/provider|httpTransport/);
    }
  });
});
