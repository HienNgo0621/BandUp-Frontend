import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateSnapshot } from '../../domain/migrateSnapshot';
import type { DomainSnapshot } from '../../domain/schema';
import type { StorageAdapter } from '../localStorageService';
import { appDataService } from '../../appDataService';
import { migrateLegacyData } from '../legacyMigration';
import { createSnapshotPersistence, SNAPSHOT_KEYS as K, type Invalidation } from '../snapshotPersistence';
import { inspectSnapshot, prepareMigration, serializeSnapshot } from '../snapshotCodec';
import { LEGACY_LOCAL_STORAGE_KEYS, STORAGE_KEYS } from '../storageKeys';
import { createStorageAccess } from '../typedStorageAccess';

function v1() {
  return { schemaVersion: 1, users: [], questionBank: [], notifications: [], legacy: {}, migratedAt: null,
    registrations: [], applications: [], submissions: [], grading: [], forumTopics: [], forumPosts: [],
    forumComments: [], forumReports: [], practiceHistory: [], studyPlan: {}, notes: [], preferences: {}, supportMessages: [] };
}
function v2(): DomainSnapshot {
  const result = migrateSnapshot(v1()); if (!result.ok) throw new Error('Invalid test fixture'); return result.value;
}
class MemoryStorage implements StorageAdapter {
  data = new Map<string, string>();
  writes: string[] = [];
  failRead?: string;
  failWrite?: string;
  failRemove?: string;
  afterWrite?: (key: string, raw: string) => void;
  getItem(key: string) { if (this.failRead === key) throw new DOMException('private diagnostic', 'SecurityError'); return this.data.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrite === key) throw new DOMException('private diagnostic', 'QuotaExceededError');
    this.data.set(key, value); this.writes.push(key); this.afterWrite?.(key, value);
  }
  removeItem(key: string) { if (this.failRemove === key) throw new Error('private diagnostic'); this.data.delete(key); }
}
const digest = async (raw: string) => Buffer.from(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))).toString('hex');
function fixture(initial: unknown = v1()) {
  const storage = new MemoryStorage();
  if (initial !== undefined) storage.data.set(K.canonical, JSON.stringify(initial));
  return { storage, service: createSnapshotPersistence({ storage: () => storage, digest }) };
}
afterEach(() => vi.unstubAllGlobals());

describe('01B.1 isolated evidence for deferred live risks', () => {
  it('reproduces live corrupt canonical reseeding without accessing real browser storage', () => {
    const storage = new MemoryStorage(); storage.data.set(K.canonical, '{broken');
    vi.stubGlobal('window', { localStorage: storage });
    const loaded = appDataService.load();
    expect(loaded.users.length).toBeGreaterThan(0);
    expect(storage.data.get(K.canonical)).not.toBe('{broken');
  });
  it('reproduces lossy old legacy ownership projection; original ep source survives', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify([{ id: 91, ownerId: 'qa-owner', h: 'Word', m: 'Meaning', extra: 'recover me' }]);
    storage.data.set('ep_notes_v4', raw); vi.stubGlobal('window', { localStorage: storage });
    const result = migrateLegacyData();
    expect(result.snapshot?.notes[0]).not.toHaveProperty('ownerId');
    expect(result.snapshot?.legacy.ep_notes_v4).toEqual(JSON.parse(raw));
    expect(storage.data.get('ep_notes_v4')).toBe(raw);
  });
});

describe('typed storage boundary and state detection', () => {
  it('distinguishes absent from valid v1/v2 without writing or activating migration', async () => {
    const { storage, service } = fixture(); storage.data.clear();
    expect(await service.read()).toEqual({ ok: true, value: null });
    for (const source of [v1(), v2()]) {
      const raw = JSON.stringify(source); storage.data.set(K.canonical, raw);
      expect(await service.read()).toEqual({ ok: true, value: source });
      expect(storage.data.get(K.canonical)).toBe(raw);
    }
    expect(storage.writes).toEqual([]);
  });
  it.each([
    ['{broken', 'invalid-json'], ['null', 'invalid-snapshot'], ['[]', 'invalid-snapshot'],
    ['{}', 'invalid-snapshot'], ['{"schemaVersion":1}', 'invalid-snapshot'],
    ['{"schemaVersion":9}', 'unsupported-schema'],
  ])('reports %s accurately and does not initialize', async (raw, code) => {
    const { storage, service } = fixture(); storage.data.set(K.canonical, raw);
    const seed = vi.fn(v2);
    expect(await service.read()).toMatchObject({ ok: false, error: { code } });
    expect(await service.initialize(seed)).toMatchObject({ ok: false, error: { code } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.data.get(K.canonical)).toBe(raw);
    expect(storage.writes).toEqual([]);
  });
  it.each([() => null, () => { throw new DOMException('private diagnostic', 'SecurityError'); }])('reports unavailable acquisition', async (storage) => {
    const service = createSnapshotPersistence({ storage, digest });
    expect(await service.read()).toMatchObject({ ok: false, error: { code: 'storage-unavailable' } });
    expect(await service.initialize(v2)).toMatchObject({ ok: false, error: { code: 'storage-unavailable' } });
  });
  it('distinguishes denied reads from missing data, with no diagnostics or writes', async () => {
    const { storage, service } = fixture(); storage.failRead = K.canonical;
    const result = await service.initialize(v2);
    expect(result).toMatchObject({ ok: false, error: { code: 'storage-read-failed' } });
    expect(JSON.stringify(result)).not.toContain('private diagnostic'); expect(storage.writes).toEqual([]);
  });
  it('reports write verification mismatch and removal failure', () => {
    const storage = new MemoryStorage(); const access = createStorageAccess(() => storage);
    storage.afterWrite = (key) => storage.data.delete(key);
    expect(access.write('x', 'data')).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    storage.failRemove = 'x';
    expect(access.remove('x')).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
  });
});

describe('fresh initialization and seed preservation', () => {
  it('initializes a verified fresh installation exactly once without using existing demo seeds', async () => {
    const { storage, service } = fixture(); storage.data.clear(); const seed = vi.fn(v2);
    expect(await service.initialize(seed)).toEqual({ ok: true, value: { state: 'initialized', revision: 0 } });
    expect(JSON.parse(storage.data.get(K.canonical)!)).toEqual(v2());
    expect(await service.initialize(seed)).toEqual({ ok: true, value: { state: 'existing', revision: 0 } });
    expect(seed).toHaveBeenCalledTimes(1); expect(storage.data.size).toBe(2);
    expect(storage.data.get(K.provenance)).toBe('{"format":1}');
  });
  it.each([v1(), v2()])('preserves existing valid empty collections and never calls seed', async (source) => {
    const { storage, service } = fixture(source); const raw = storage.data.get(K.canonical); const seed = vi.fn(v2);
    const result = await service.initialize(seed); expect(result.ok).toBe(true);
    expect(seed).not.toHaveBeenCalled(); expect(storage.data.get(K.canonical)).toBe(raw); expect(storage.writes).toEqual([K.provenance]);
    expect(storage.data.get(K.provenance)).toBe('{"format":1}');
  });
  it.each([...LEGACY_LOCAL_STORAGE_KEYS, STORAGE_KEYS.migration])('holds legacy key %s unchanged, including malformed source bytes', async (key) => {
    const { storage, service } = fixture(); storage.data.clear(); storage.data.set(key, '{unparsed private synthetic');
    const seed = vi.fn(v2);
    expect(await service.initialize(seed)).toEqual({ ok: true, value: { state: 'migration-pending', sourceKeys: [key] } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.data.size).toBe(1); expect(storage.writes).toEqual([]);
  });
  it('does not seed after a legacy read fails', async () => {
    const { storage, service } = fixture(); storage.data.clear(); storage.failRead = 'ep_plan_v4';
    const seed = vi.fn(v2); expect(await service.initialize(seed)).toMatchObject({ ok: false, error: { code: 'storage-read-failed' } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.writes).toEqual([]);
  });
  it('does not seed when staging artifacts exist', async () => {
    const { storage, service } = fixture(); storage.data.clear(); storage.data.set(K.candidate, 'unknown source');
    const seed = vi.fn(v2); expect(await service.initialize(seed)).toMatchObject({ ok: false, error: { code: 'recovery-required' } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.data.get(K.candidate)).toBe('unknown source');
  });
  it('does not initialize over an orphaned retained source backup', async () => {
    const { storage, service } = fixture(); storage.data.clear(); storage.data.set(K.sourceBackup, JSON.stringify(v1()));
    const seed = vi.fn(v2);
    expect(await service.initialize(seed)).toMatchObject({ ok: false, error: { code: 'recovery-required' } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.writes).toEqual([]);
  });
  it('rechecks freshness after asynchronous preparation and preserves a newly arrived legacy source', async () => {
    const storage = new MemoryStorage();
    const service = createSnapshotPersistence({ storage: () => storage, digest: async (raw) => { storage.data.set('ep_db_v3', 'new legacy'); return digest(raw); } });
    expect(await service.initialize(v2)).toMatchObject({ ok: false, error: { code: 'migration-pending' } });
    expect(storage.writes).toEqual([]); expect(storage.data.get('ep_db_v3')).toBe('new legacy');
  });
  it('rejects invalid, throwing, nonzero-revision and v1 seed factories', async () => {
    for (const seed of [() => null, () => { throw new Error('private'); }, () => ({ ...v2(), revision: 3 }), v1]) {
      const { storage, service } = fixture(); storage.data.clear();
      expect((await service.initialize(seed)).ok).toBe(false); expect(storage.writes).toEqual([]);
    }
  });
});

describe('migration lifecycle and protected recovery artifacts', () => {
  it('preserves exact original source before replacement and reports normalized/quarantined data', async () => {
    const source = { ...v1(), users: [{ id: 'qa-u1', name: 'Synthetic learner', role: 'student', status: 'active', label: 'Student' }],
      notes: [{ id: 2, ownerId: 'qa-u1', type: 'Vocabulary', heading: 'Word', meaning: 'Meaning' }, { id: 'lost-owner', heading: 'Recover me' }],
      unexpected: { keep: ['historical source'] } };
    const { storage, service } = fixture(source); const original = JSON.stringify(source, null, 2); storage.data.set(K.canonical, original);
    let backup = '';
    storage.afterWrite = (key, raw) => {
      if (key === K.journal) { backup = JSON.parse(raw).originalRaw; expect(storage.data.get(K.canonical)).toBe(original); }
      if (key === K.candidate) expect(storage.data.get(K.canonical)).toBe(original);
    };
    const result = await service.migrate(); expect(result).toMatchObject({ ok: true, value: { revision: 0, cleanupPending: false,
      summary: { sourceVersion: 1, targetVersion: 2, normalizedIdentifiers: 1, quarantinedFragments: 2 } } });
    expect(backup).toBe(original);
    const saved: DomainSnapshot = JSON.parse(storage.data.get(K.canonical)!);
    expect(saved.notes[0]).toMatchObject({ id: 'notes:legacy-number:2', ownerId: 'qa-u1' });
    expect(saved.migrationReview.map((item) => item.original)).toContainEqual(source.notes[1]);
    expect(saved.migrationReview.map((item) => item.original)).toContainEqual(source.unexpected);
    expect(saved.users).toEqual(source.users); expect(storage.data.size).toBe(3);
    expect(storage.data.get(K.provenance)).toBe('{"format":1}');
    expect(storage.data.get(K.sourceBackup)).toBe(original);
    const persisted = storage.data.get(K.canonical); const writes = storage.writes.length;
    expect((await service.migrate()).ok).toBe(true); expect(storage.writes.length).toBe(writes);
    expect(storage.data.get(K.canonical)).toBe(persisted); expect(source.schemaVersion).toBe(1);
  });
  it('retains pre-existing review records across refresh and an ordinary logical commit', async () => {
    const source = v2(); source.migrationReview.push({ path: 'notes[0]', reason: 'owner-unresolved', original: { id: 'preserved', old: true } });
    const { storage, service } = fixture(source); const original = JSON.stringify(source);
    expect((await service.migrate()).ok).toBe(true); expect(storage.data.get(K.canonical)).toBe(original);
    expect((await service.compareAndSwap(0, source)).ok).toBe(true);
    expect(JSON.parse(storage.data.get(K.canonical)!).migrationReview).toEqual(source.migrationReview);
  });
  it('retains original v1 bytes after migration and subsequent logical commits', async () => {
    const { storage, service } = fixture(); const original = JSON.stringify(v1(), null, 2); storage.data.set(K.canonical, original);
    expect((await service.migrate()).ok).toBe(true);
    expect((await service.compareAndSwap(0, v2())).ok).toBe(true);
    expect(storage.data.get(K.sourceBackup)).toBe(original);
    expect(await service.read()).toEqual({ ok: true, value: { ...v2(), revision: 1 } });
    expect(storage.data.has(K.journal)).toBe(false); expect(storage.data.has(K.candidate)).toBe(false);
  });
  it('never overwrites a different retained source backup', async () => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical);
    storage.data.set(K.sourceBackup, 'previous recovery source');
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: 'recovery-required' } });
    expect(storage.data.get(K.sourceBackup)).toBe('previous recovery source'); expect(storage.data.get(K.canonical)).toBe(original);
    expect(storage.data.has(K.candidate)).toBe(false);
  });
  it('requires safe cancellation after a failed source backup, then retries without losing source', async () => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical); storage.failWrite = K.sourceBackup;
    expect((await service.migrate()).ok).toBe(false); storage.failWrite = undefined;
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'incomplete' } });
    expect((await service.recover()).ok).toBe(false); expect((await service.cancelPending()).ok).toBe(true);
    expect(storage.data.get(K.canonical)).toBe(original); expect((await service.migrate()).ok).toBe(true);
    expect(storage.data.get(K.sourceBackup)).toBe(original);
  });
  it.each(['passwordHash', 'password', 'accessToken', 'refreshToken'])('does not duplicate credential-bearing %s into recovery storage', async (key) => {
    const source = { ...v1(), legacy: { account: { [key]: 'synthetic-only-secret' } } };
    const { storage, service } = fixture(source); const original = storage.data.get(K.canonical);
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: key === 'password' ? 'invalid-snapshot' : 'migration-pending' } });
    expect(storage.writes).toEqual([]); expect(storage.data.get(K.canonical)).toBe(original);
  });
  it('guards credential strings nested inside legacy JSON without printing source values', async () => {
    const { storage, service } = fixture({ ...v1(), legacy: { raw: '{"password":"synthetic-private"}' } });
    const result = await service.migrate(); expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain('synthetic-private'); expect(storage.writes).toEqual([]);
  });
  it('blocks source corruption/future schemas without replacing original or seeding', async () => {
    for (const raw of ['{broken', '{"schemaVersion":1}', '{"schemaVersion":8}']) {
      const { storage, service } = fixture(); storage.data.set(K.canonical, raw);
      expect((await service.migrate()).ok).toBe(false); expect(storage.writes).toEqual([]); expect(storage.data.get(K.canonical)).toBe(raw);
    }
  });
  it('does not silently repair damaged v2 active data during ordinary reads or writes', async () => {
    const source = { ...v2(), notes: [{ id: 'bad', ownerId: 'missing' }] };
    const { storage, service } = fixture(source); const before = storage.data.get(K.canonical);
    expect(await service.read()).toMatchObject({ ok: false, error: { code: 'invalid-snapshot' } });
    expect((await service.migrate()).ok).toBe(false); expect((await service.compareAndSwap(0, v2())).ok).toBe(false);
    expect(storage.data.get(K.canonical)).toBe(before); expect(storage.writes).toEqual([]);
  });
  it.each([K.journal, K.sourceBackup, K.candidate, K.canonical])('failure at %s preserves exact original, reports failure and emits no commit', async (key) => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical); const events: Invalidation[] = [];
    service.subscribe((event) => events.push(event)); storage.failWrite = key;
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(storage.data.get(K.canonical)).toBe(original); expect(events).toEqual([]);
    if (key !== K.journal) expect(JSON.parse(storage.data.get(K.journal)!).originalRaw).toBe(original);
  });
  it('recovers a prepared candidate after reload with deterministic revision and quarantine', async () => {
    const { storage, service } = fixture({ ...v1(), attempts: { legacySession: { id: 'qa-preserve', ownerId: 'qa-u1', userId: 'qa-u1' } } });
    storage.failWrite = K.canonical; expect((await service.migrate()).ok).toBe(false);
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'prepared' } });
    storage.failWrite = undefined;
    const reloaded = createSnapshotPersistence({ storage: () => storage, digest });
    expect(await reloaded.recover()).toEqual({ ok: true, value: { revision: 0, cleanupPending: false } });
    const source: DomainSnapshot = JSON.parse(storage.data.get(K.canonical)!);
    expect(source.migrationReview).toContainEqual(expect.objectContaining({ path: 'attempts', original: { legacySession: { id: 'qa-preserve', ownerId: 'qa-u1', userId: 'qa-u1' } } }));
    expect((await reloaded.migrate()).ok).toBe(true); expect(storage.data.size).toBe(3);
    expect(storage.data.get(K.provenance)).toBe('{"format":1}');
    expect(JSON.parse(storage.data.get(K.sourceBackup)!).attempts.legacySession.id).toBe('qa-preserve');
  });
  it('keeps incomplete staging blocked until explicit safe cancellation; retry then succeeds', async () => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical); storage.failWrite = K.candidate;
    expect((await service.migrate()).ok).toBe(false); storage.failWrite = undefined;
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'incomplete' } });
    expect((await service.recover()).ok).toBe(false); expect((await service.migrate()).ok).toBe(false);
    expect(await service.cancelPending()).toEqual({ ok: true, value: undefined });
    expect(storage.data.get(K.canonical)).toBe(original); expect((await service.migrate()).ok).toBe(true);
  });
  it.each([K.candidate, K.journal])('cleanup failure at %s reports an actual committed revision and can finish after reload', async (key) => {
    const { storage, service } = fixture(); storage.failRemove = key;
    expect(await service.migrate()).toMatchObject({ ok: true, value: { revision: 0, cleanupPending: true } });
    expect(JSON.parse(storage.data.get(K.canonical)!).schemaVersion).toBe(2);
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'committed' } });
    storage.failRemove = undefined;
    expect(await createSnapshotPersistence({ storage: () => storage, digest }).recover()).toEqual({ ok: true, value: { revision: 0, cleanupPending: false } });
    expect(storage.data.size).toBe(3); expect(storage.data.get(K.sourceBackup)).toBe(JSON.stringify(v1()));
    expect(storage.data.get(K.provenance)).toBe('{"format":1}');
  });
  it('reports uncertain activation as failure and verifies a completed commit on recovery', async () => {
    const { storage, service } = fixture(); const events: Invalidation[] = []; service.subscribe((event) => events.push(event));
    storage.afterWrite = (key) => { if (key === K.canonical) throw new Error('interrupted after set'); };
    expect((await service.migrate()).ok).toBe(false); expect(events).toEqual([]);
    storage.afterWrite = undefined;
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'committed' } });
    expect((await service.recover()).ok).toBe(true); expect(events).toEqual([{ reason: 'commit', revision: 0 }]);
  });
  it.each([K.journal, K.sourceBackup, K.candidate])('contains interruption after writing %s and preserves the active source', async (key) => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical); const listener = vi.fn(); service.subscribe(listener);
    storage.afterWrite = (written) => { if (written === key) throw new Error('Synthetic interruption after set'); };
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(storage.data.get(K.canonical)).toBe(original); expect(listener).not.toHaveBeenCalled();
    expect(JSON.parse(storage.data.get(K.journal)!).originalRaw).toBe(original);
    storage.afterWrite = undefined;
    if (key === K.candidate) expect((await service.recover()).ok).toBe(true);
    else { expect((await service.cancelPending()).ok).toBe(true); expect((await service.migrate()).ok).toBe(true); }
    expect(storage.data.get(K.sourceBackup)).toBe(original);
  });
  it('rejects a tampered candidate without activating or losing original recovery context', async () => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical); storage.failWrite = K.canonical;
    await service.migrate(); storage.failWrite = undefined; storage.data.set(K.candidate, JSON.stringify({ ...v2(), preferences: { changed: true } }));
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'incomplete' } });
    expect((await service.recover()).ok).toBe(false); expect(storage.data.get(K.canonical)).toBe(original);
    expect(JSON.parse(storage.data.get(K.journal)!).originalRaw).toBe(original);
  });
  it('does not activate when the retained source backup changes during preparation', async () => {
    const { storage, service } = fixture(); const original = storage.data.get(K.canonical);
    storage.afterWrite = (key) => { if (key === K.candidate) storage.data.set(K.sourceBackup, 'changed recovery source'); };
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: 'recovery-required' } });
    expect(storage.data.get(K.canonical)).toBe(original);
    expect(JSON.parse(storage.data.get(K.journal)!).originalRaw).toBe(original);
  });
  it.each(['{broken', '{}', '{"format":1,"originalRaw":null,"candidateHash":"bad","targetRevision":0}'])('preserves malformed journal %s for explicit review', async (raw) => {
    const { storage, service } = fixture(); storage.data.set(K.journal, raw); const original = storage.data.get(K.canonical);
    expect((await service.recover()).ok).toBe(false); expect((await service.cancelPending()).ok).toBe(false);
    expect(storage.data.get(K.journal)).toBe(raw); expect(storage.data.get(K.canonical)).toBe(original);
  });
  it.each([JSON.stringify({ ...v2(), revision: 9 }), '{"schemaVersion":9}'])('does not replace changed/future canonical during recovery', async (newRaw) => {
    const { storage, service } = fixture(); storage.failWrite = K.canonical; await service.migrate(); storage.failWrite = undefined;
    storage.data.set(K.canonical, newRaw);
    expect((await service.recover()).ok).toBe(false); expect((await service.cancelPending()).ok).toBe(false);
    expect(storage.data.get(K.canonical)).toBe(newRaw); expect(storage.data.has(K.journal)).toBe(true);
  });
  it('retains orphan candidates instead of assuming a fresh installation', async () => {
    const { storage, service } = fixture(); storage.data.set(K.candidate, JSON.stringify(v2()));
    expect(await service.inspectRecovery()).toEqual({ ok: true, value: { state: 'orphan' } });
    expect((await service.recover()).ok).toBe(false); expect((await service.cancelPending()).ok).toBe(false);
  });
  it('fails safely when digest support is unavailable', async () => {
    const storage = new MemoryStorage(); storage.data.set(K.canonical, JSON.stringify(v1()));
    const service = createSnapshotPersistence({ storage: () => storage, digest: async () => { throw new Error('unavailable'); } });
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: 'storage-unavailable' } }); expect(storage.writes).toEqual([]);
  });
});

describe('revision consistency, races and invalidation', () => {
  it('commits once, increments persisted revision, and leaves caller input immutable', async () => {
    const { storage, service } = fixture(v2()); const candidate = v2(); candidate.preferences = { theme: 'dark' };
    const before = JSON.stringify(candidate); const events: Invalidation[] = [];
    service.subscribe((event) => { expect(JSON.parse(storage.data.get(K.canonical)!).revision).toBe(1); events.push(event); });
    expect(await service.compareAndSwap(0, candidate)).toEqual({ ok: true, value: undefined });
    expect(JSON.parse(storage.data.get(K.canonical)!)).toMatchObject({ revision: 1, preferences: { theme: 'dark' } });
    expect(JSON.stringify(candidate)).toBe(before); expect(events).toEqual([{ reason: 'commit', revision: 1 }]);
  });
  it('rejects stale expected revision and duplicate concurrent saves without overwrite', async () => {
    const { storage, service } = fixture(v2());
    const results = await Promise.all([service.compareAndSwap(0, v2()), service.compareAndSwap(0, v2())]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results[1]).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(JSON.parse(storage.data.get(K.canonical)!).revision).toBe(1);
  });
  it('does not advance revision or invalidate on failed writes', async () => {
    const { storage, service } = fixture(v2()); storage.failWrite = K.canonical;
    const listener = vi.fn(); service.subscribe(listener);
    expect((await service.compareAndSwap(0, v2())).ok).toBe(false);
    expect(JSON.parse(storage.data.get(K.canonical)!).revision).toBe(0); expect(listener).not.toHaveBeenCalled();
  });
  it('detects external replacement before activation and preserves the other writer', async () => {
    const { storage, service } = fixture(v2()); const other = JSON.stringify({ ...v2(), revision: 4 });
    storage.afterWrite = (key) => { if (key === K.candidate) storage.data.set(K.canonical, other); };
    expect(await service.compareAndSwap(0, v2())).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(storage.data.get(K.canonical)).toBe(other); expect((await service.recover()).ok).toBe(false);
  });
  it('detects a persisted-value mismatch rather than claiming success', async () => {
    const { storage, service } = fixture(v2()); const other = JSON.stringify({ ...v2(), revision: 4 }); const listener = vi.fn(); service.subscribe(listener);
    storage.afterWrite = (key) => { if (key === K.canonical) storage.data.set(K.canonical, other); };
    expect(await service.compareAndSwap(0, v2())).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(storage.data.get(K.canonical)).toBe(other); expect(listener).not.toHaveBeenCalled();
  });
  it('validates initialization via compareAndSwap(null), disallows v1 writes and unsafe revisions', async () => {
    const { storage, service } = fixture();
    expect(await service.compareAndSwap(0, v2())).toMatchObject({ ok: false, error: { code: 'migration-pending' } });
    storage.data.clear(); expect((await service.compareAndSwap(null, v2())).ok).toBe(true);
    expect((await service.compareAndSwap(-1, v2())).ok).toBe(false);
    storage.data.set(K.canonical, JSON.stringify({ ...v2(), revision: Number.MAX_SAFE_INTEGER }));
    expect((await service.compareAndSwap(Number.MAX_SAFE_INTEGER, v2())).ok).toBe(false);
  });
  it('bridges external invalidation separately, ignores staging keys, unsubscribes and disposes', async () => {
    const storage = new MemoryStorage(); storage.data.set(K.canonical, JSON.stringify(v2()));
    let changed: (key: string | null) => void = () => undefined; const stop = vi.fn();
    const service = createSnapshotPersistence({ storage: () => storage, digest, listen: (onKey) => { changed = onKey; return stop; } });
    const listener = vi.fn(); const unsubscribe = service.subscribe(listener);
    changed(K.candidate); expect(listener).not.toHaveBeenCalled(); changed(K.canonical); changed(null);
    expect(listener.mock.calls).toEqual([[{ reason: 'external' }], [{ reason: 'external' }]]);
    unsubscribe(); changed(K.canonical); expect(listener).toHaveBeenCalledTimes(2);
    service.subscribe(() => { throw new Error('listener error'); }); expect((await service.compareAndSwap(0, v2())).ok).toBe(true);
    service.dispose(); expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe('serialization and safe migration result contracts', () => {
  it.each([BigInt(1), undefined, new Date(), Number.NaN, [undefined], Array(1)])('rejects non-JSON source %s without silent coercion', (value) => {
    expect(serializeSnapshot(value)).toMatchObject({ ok: false, error: { code: 'serialization-failed' } });
  });
  it('rejects cycles and serialization failures before persistence', async () => {
    const { storage, service } = fixture(v2()); const candidate = v2(); candidate.legacy.self = candidate;
    expect(await service.compareAndSwap(0, candidate)).toMatchObject({ ok: false, error: { code: 'serialization-failed' } });
    expect(storage.writes).toEqual([]);
  });
  it('keeps deterministic preparation and serialized quarantine stable without mutating input', () => {
    const source = { ...v1(), attempts: { originalId: { ownerId: 'qa-u1' } } }; const raw = JSON.stringify(source);
    const first = prepareMigration(raw); expect(first.ok).toBe(true);
    expect(prepareMigration(raw)).toEqual(first); expect(JSON.stringify(source)).toBe(raw);
    if (!first.ok) throw new Error('fixture failed');
    expect(inspectSnapshot(first.value.raw)).toMatchObject({ ok: true, value: { snapshot: first.value.snapshot } });
    expect(prepareMigration(first.value.raw)).toMatchObject({ ok: true, value: { summary: { quarantinedFragments: 0, retainedReviewEntries: 1 } } });
  });
  it('returns a typed failure for an excessively nested source rather than throwing or replacing storage', async () => {
    const { storage, service } = fixture();
    const raw = JSON.stringify(v1()).slice(0, -1) + ',"deepUnknown":' + '['.repeat(15000) + '0' + ']'.repeat(15000) + '}';
    storage.data.set(K.canonical, raw);
    expect(await service.migrate()).toMatchObject({ ok: false, error: { code: 'invalid-snapshot' } });
    expect(storage.writes).toEqual([]); expect(storage.data.get(K.canonical)).toBe(raw);
  });
});
