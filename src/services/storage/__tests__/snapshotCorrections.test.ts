import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { migrateSnapshot } from '../../domain/migrateSnapshot';
import type { DomainSnapshot } from '../../domain/schema';
import type { StorageAdapter } from '../localStorageService';
import { createSnapshotPersistence, SNAPSHOT_KEYS as K } from '../snapshotPersistence';
import { serializeSnapshot } from '../snapshotCodec';

const PROVENANCE = 'bandup_snapshot_initialized_v1';
const digest = async (raw: string) => createHash('sha256').update(raw).digest('hex');
class Memory implements StorageAdapter {
  data = new Map<string, string>();
  writes: string[] = [];
  fail?: string;
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, raw: string) {
    if (key === this.fail) throw new DOMException('Synthetic failure', 'QuotaExceededError');
    this.data.set(key, raw); this.writes.push(key);
  }
  removeItem(key: string) { this.data.delete(key); }
}
function legacy() {
  return { schemaVersion: 1, users: [{ id: 'correction-user', name: 'Synthetic learner', role: 'student', status: 'active', label: 'Learner' }],
    questionBank: [], notifications: [], legacy: {}, migratedAt: null, registrations: [], applications: [], submissions: [], grading: [],
    forumTopics: [], forumPosts: [], forumComments: [], forumReports: [], practiceHistory: [], studyPlan: {}, preferences: {}, supportMessages: [],
    notes: [{ id: 'correction-note', ownerId: 'correction-user', type: 'Other', heading: 'Preserve', meaning: 'Synthetic content' }] };
}
function snapshot(): DomainSnapshot {
  const converted = migrateSnapshot(legacy()); if (!converted.ok) throw new Error('Invalid synthetic fixture'); return converted.value;
}
function setup(initial?: unknown) {
  const storage = new Memory(); if (initial !== undefined) storage.data.set(K.canonical, JSON.stringify(initial));
  const service = createSnapshotPersistence({ storage: () => storage, digest }); return { storage, service };
}

describe('FIX-01B1-01 initialization provenance', () => {
  it('IR-B11-01: never seeds again after only canonical is removed, including a refreshed adapter', async () => {
    const { storage, service } = setup(); expect((await service.initialize(snapshot)).ok).toBe(true);
    storage.removeItem(K.canonical); const seed = vi.fn(snapshot);
    const refreshed = createSnapshotPersistence({ storage: () => storage, digest });
    expect(await refreshed.initialize(seed)).toMatchObject({ ok: false, error: { code: 'recovery-required' } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.getItem(K.canonical)).toBeNull();
    expect(await refreshed.read()).toMatchObject({ ok: false, error: { code: 'recovery-required' } });
    expect((await refreshed.compareAndSwap(null, snapshot())).ok).toBe(false);
  });
  it('persists a minimal non-sensitive marker before reporting fresh initialization success', async () => {
    const { storage, service } = setup(); expect((await service.initialize(snapshot)).ok).toBe(true);
    expect(storage.getItem(PROVENANCE)).toBe('{"format":1}');
    expect(storage.writes.indexOf(PROVENANCE)).toBeLessThan(storage.writes.indexOf(K.canonical));
    const seed = vi.fn(snapshot); expect((await service.initialize(seed)).ok).toBe(true); expect(seed).not.toHaveBeenCalled();
  });
  it.each([legacy(), { ...snapshot(), notes: [] }])('adopts valid existing unmarked data without reseeding or replacing canonical', async (source) => {
    const { storage, service } = setup(source); const original = storage.getItem(K.canonical); const seed = vi.fn(snapshot);
    expect((await service.initialize(seed)).ok).toBe(true); expect(seed).not.toHaveBeenCalled(); expect(storage.getItem(K.canonical)).toBe(original);
    expect(storage.getItem(PROVENANCE)).toBe('{"format":1}'); storage.removeItem(K.canonical);
    expect((await service.initialize(seed)).ok).toBe(false); expect(seed).not.toHaveBeenCalled();
  });
  it('does not report success or activate canonical when provenance cannot be written; prepared recovery can retry', async () => {
    const { storage, service } = setup(); storage.fail = PROVENANCE; const listener = vi.fn(); service.subscribe(listener);
    expect(await service.initialize(snapshot)).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(storage.getItem(K.canonical)).toBeNull(); expect(listener).not.toHaveBeenCalled();
    storage.fail = undefined; expect((await service.recover()).ok).toBe(true);
    expect(storage.getItem(PROVENANCE)).toBe('{"format":1}'); expect(JSON.parse(storage.getItem(K.canonical)!)).toEqual(snapshot());
  });
  it('retains provenance after interrupted activation, then recovers without a second seed', async () => {
    const { storage, service } = setup(); storage.fail = K.canonical;
    expect((await service.initialize(snapshot)).ok).toBe(false); expect(storage.getItem(PROVENANCE)).not.toBeNull();
    const seed = vi.fn(snapshot); storage.fail = undefined; expect((await service.initialize(seed)).ok).toBe(false); expect(seed).not.toHaveBeenCalled();
    expect((await service.recover()).ok).toBe(true); expect((await service.initialize(seed)).ok).toBe(true); expect(seed).not.toHaveBeenCalled();
  });
  it('holds missing canonical with legacy evidence and never seeds after denied reads', async () => {
    const { storage, service } = setup(); storage.data.set('ep_notes_v4', '{retain original'); const seed = vi.fn(snapshot);
    expect(await service.initialize(seed)).toMatchObject({ ok: true, value: { state: 'migration-pending' } }); expect(seed).not.toHaveBeenCalled();
    const denied = createSnapshotPersistence({ storage: () => ({ getItem: () => { throw new Error('Denied'); }, setItem: () => undefined, removeItem: () => undefined }), digest });
    expect((await denied.initialize(seed)).ok).toBe(false); expect(seed).not.toHaveBeenCalled();
  });
  it('treats a completely cleared origin as fresh only after all evidence is removed', async () => {
    const { storage, service } = setup(); await service.initialize(snapshot); storage.data.clear(); const seed = vi.fn(snapshot);
    expect((await service.initialize(seed)).ok).toBe(true); expect(seed).toHaveBeenCalledTimes(1);
  });
  it('preserves malformed provenance instead of treating it as a new installation', async () => {
    const { storage, service } = setup(); storage.data.set(PROVENANCE, '{bad'); const seed = vi.fn(snapshot);
    expect((await service.initialize(seed)).ok).toBe(false); expect(seed).not.toHaveBeenCalled(); expect(storage.getItem(PROVENANCE)).toBe('{bad');
  });
  it('reports a failed provenance read without calling the seed factory', async () => {
    const storage = new Memory(); const read = storage.getItem.bind(storage);
    storage.getItem = (key) => { if (key === PROVENANCE) throw new Error('Synthetic read denial'); return read(key); };
    const service = createSnapshotPersistence({ storage: () => storage, digest }); const seed = vi.fn(snapshot);
    expect(await service.initialize(seed)).toMatchObject({ ok: false, error: { code: 'storage-read-failed' } });
    expect(seed).not.toHaveBeenCalled(); expect(storage.writes).toEqual([]);
  });
  it('recovers interruption after the marker was persisted but before its write could be verified', async () => {
    const { storage, service } = setup(); const write = storage.setItem.bind(storage);
    storage.setItem = (key, raw) => { write(key, raw); if (key === PROVENANCE) throw new Error('Synthetic interruption after set'); };
    const listener = vi.fn(); service.subscribe(listener);
    expect((await service.initialize(snapshot)).ok).toBe(false); expect(listener).not.toHaveBeenCalled(); expect(storage.getItem(K.canonical)).toBeNull();
    storage.setItem = write; expect((await service.recover()).ok).toBe(true); expect(storage.getItem(PROVENANCE)).toBe('{"format":1}');
  });
  it('keeps existing valid data readable if provenance adoption fails', async () => {
    const source = snapshot(); const { storage, service } = setup(source); storage.fail = PROVENANCE;
    expect(await service.initialize(snapshot)).toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
    expect(await service.read()).toEqual({ ok: true, value: source }); expect(storage.getItem(K.canonical)).toBe(JSON.stringify(source));
  });
  it('keeps legacy four-key injected configurations compatible with a namespaced provenance key', async () => {
    const storage = new Memory(); const keys = { canonical: 'qa:data', journal: 'qa:journal', candidate: 'qa:candidate', sourceBackup: 'qa:source' };
    const service = createSnapshotPersistence({ storage: () => storage, keys, digest });
    expect((await service.initialize(snapshot)).ok).toBe(true); expect(storage.getItem('qa:data:initialized')).toBe('{"format":1}');
    expect(storage.getItem(PROVENANCE)).toBeNull(); storage.removeItem(keys.canonical); expect((await service.initialize(snapshot)).ok).toBe(false);
  });
  it.each(['initialize', 'migrate', 'recover', 'initialize-committed'])('never reports completion if canonical disappears during provenance adoption: %s', async (operation) => {
    const source = snapshot(); const { storage, service } = setup(source); const raw = storage.getItem(K.canonical)!;
    const staged = operation === 'recover' || operation === 'initialize-committed';
    if (staged) {
      storage.data.set(K.journal, JSON.stringify({ format: 1, originalRaw: null, candidateHash: await digest(raw), targetRevision: 0 }));
      storage.data.set(K.candidate, raw);
    }
    const write = storage.setItem.bind(storage);
    storage.setItem = (key, value) => { write(key, value); if (key === PROVENANCE) storage.data.delete(K.canonical); };
    const listener = vi.fn(); service.subscribe(listener);
    const result = await (operation === 'migrate' ? service.migrate() : operation === 'recover' ? service.recover() : service.initialize(snapshot));
    expect(result).toMatchObject({ ok: false, error: { code: 'conflict' } }); expect(listener).not.toHaveBeenCalled();
    expect(storage.getItem(K.canonical)).toBeNull();
    if (staged) expect(storage.data.has(K.journal)).toBe(true);
  });
});

describe('FIX-01B1-02 plain JSON serialization boundary', () => {
  it.each(['root', 'nested', 'throwing', 'inherited', 'array'])('rejects %s custom serialization without calling it, saving or invalidating', async (kind) => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot(); const hook = vi.fn(() => { if (kind === 'throwing') throw new Error('Synthetic'); return {}; });
    if (kind === 'root') Object.defineProperty(candidate, 'toJSON', { value: hook });
    else if (kind === 'inherited') Object.setPrototypeOf(candidate.preferences, { toJSON: hook });
    else if (kind === 'array') Object.defineProperty(candidate.notes, 'toJSON', { value: hook });
    else { candidate.preferences.mustPreserve = 'Synthetic new preference'; Object.defineProperty(candidate.preferences, 'toJSON', { value: hook }); }
    const before = storage.getItem(K.canonical); const listener = vi.fn(); service.subscribe(listener);
    expect(await service.compareAndSwap(0, candidate)).toMatchObject({ ok: false, error: { code: 'serialization-failed' } });
    expect(hook).not.toHaveBeenCalled(); expect(storage.getItem(K.canonical)).toBe(before); expect(storage.writes).toEqual([]); expect(listener).not.toHaveBeenCalled();
  });
  it('rejects accessor behavior without invoking it or silently changing data', async () => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot(); const get = vi.fn(() => 'changed');
    Object.defineProperty(candidate.preferences, 'mustPreserve', { get, enumerable: true });
    expect((await service.compareAndSwap(0, candidate)).ok).toBe(false); expect(get).not.toHaveBeenCalled(); expect(storage.writes).toEqual([]);
  });
  it('rejects root seed serialization hooks before any persistence', async () => {
    const { storage, service } = setup(); const value = snapshot(); const hook = vi.fn(() => ({}));
    Object.defineProperty(value, 'toJSON', { value: hook }); expect((await service.initialize(() => value)).ok).toBe(false);
    expect(hook).not.toHaveBeenCalled(); expect(storage.writes).toEqual([]);
  });
  it('preserves literal JSON toJSON keys, reserved property names, frozen and null-prototype data', async () => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot();
    candidate.preferences = Object.assign(Object.create(null), JSON.parse('{"toJSON":"ordinary data","__proto__":{"keep":true},"empty":""}'));
    Object.freeze(candidate.preferences); const expected = JSON.stringify(candidate.preferences);
    expect((await service.compareAndSwap(0, candidate)).ok).toBe(true); expect(JSON.stringify(JSON.parse(storage.getItem(K.canonical)!).preferences)).toBe(expected);
  });
});

describe('FIX-01B1-03 contract optional fields', () => {
  it.each(['absent', 'undefined', 'populated'])('accepts a valid %s profile without mutating the candidate', async (kind) => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot();
    if (kind === 'undefined') candidate.users[0].profile = undefined;
    if (kind === 'populated') candidate.users[0].profile = { shortName: '', joinedAt: 0, details: { enabled: false } };
    const expected = JSON.parse(JSON.stringify(candidate)); expect((await service.compareAndSwap(0, candidate)).ok).toBe(true);
    expect(JSON.parse(storage.getItem(K.canonical)!)).toEqual({ ...expected, revision: 1 });
    if (kind === 'undefined') { expect(Object.hasOwn(candidate.users[0], 'profile')).toBe(true); expect(candidate.users[0].profile).toBeUndefined(); }
  });
  it('omits representative optional nested fields and preserves all defined false/zero/empty/null data', async () => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot();
    candidate.users[0].email = undefined; candidate.users[0].createdAt = 0; candidate.users[0].profile = { shortName: undefined, label: '', joinedAt: 0 };
    candidate.notes[0].example = undefined; candidate.notes[0].reference = { kind: 'Other', title: '', token: undefined, question: 0 };
    candidate.preferences = { enabled: false, minutes: 0, label: '', optionalValue: null };
    expect((await service.compareAndSwap(0, candidate)).ok).toBe(true);
    const saved = JSON.parse(storage.getItem(K.canonical)!); expect(saved).toEqual({ ...JSON.parse(JSON.stringify(candidate)), revision: 1 });
    expect(candidate.notes[0].reference).toHaveProperty('token', undefined);
    expect(serializeSnapshot(saved)).toEqual({ ok: true, value: JSON.stringify(saved) });
  });
  it.each(['required', 'array', 'unknown-json', 'prohibited-null'])('rejects %s instead of erasing invalid data', async (kind) => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot();
    if (kind === 'required') Object.defineProperty(candidate.users[0], 'name', { value: undefined, enumerable: true });
    if (kind === 'array') Object.defineProperty(candidate.notes, '0', { value: undefined, enumerable: true });
    if (kind === 'unknown-json') Object.defineProperty(candidate.preferences, 'unknown', { value: undefined, enumerable: true });
    if (kind === 'prohibited-null') Object.defineProperty(candidate.users[0], 'profile', { value: null, enumerable: true });
    const before = storage.getItem(K.canonical); expect((await service.compareAndSwap(0, candidate)).ok).toBe(false);
    expect(storage.getItem(K.canonical)).toBe(before); expect(storage.writes).toEqual([]);
  });
  it('normalizes nested content and attempt optionals while preserving a legitimate completed result', async () => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot();
    candidate.questionBank = [{ id: 'content', title: 'Synthetic content', skill: 'Reading', status: 'Archived', source: undefined,
      sections: [{ id: 'section', title: 'Section', content: undefined, instructions: undefined,
        groups: [{ id: 'group', type: 'Other', startQuestionNumber: 1, questions: [{ id: 'question', number: 1, prompt: '', options: undefined, explanation: undefined }] }] }] }];
    candidate.attempts = [{ id: 'attempt', ownerId: 'correction-user', userId: 'correction-user', questionSetId: 'content', skill: 'Reading',
      status: 'completed', stage: 'Completed', startedAt: 0, submittedAt: undefined, remainingSeconds: 0, flaggedQuestionIds: [], answers: [],
      result: { score: undefined, skillScores: { Reading: undefined, Listening: 0 } } }];
    expect((await service.compareAndSwap(0, candidate)).ok).toBe(true);
    expect(JSON.parse(storage.getItem(K.canonical)!)).toEqual({ ...JSON.parse(JSON.stringify(candidate)), revision: 1 });
    expect(candidate.attempts[0].result).toHaveProperty('score', undefined);
  });
  it('preserves permitted nullable relationships and zero/false values in active records', async () => {
    const { storage, service } = setup(snapshot()); const candidate = snapshot();
    candidate.forumPosts = [{ id: 'post', ownerId: 'correction-user', authorId: 'correction-user', title: '', body: '', tags: [], visibility: 'PUBLIC', status: 'published', reactionCount: 0 }];
    candidate.forumComments = [{ id: 'comment', postId: 'post', authorId: 'correction-user', body: '', parentId: null, hidden: false, createdAt: 0, updatedAt: undefined }];
    candidate.applications = [{ id: 'application', ownerId: 'correction-user', first: '', last: '', email: '', qualification: '', status: 'pending', submittedAt: 0,
      decidedBy: null, decidedAt: null, decisionReason: undefined, evidence: undefined }];
    expect((await service.compareAndSwap(0, candidate)).ok).toBe(true);
    expect(JSON.parse(storage.getItem(K.canonical)!)).toEqual({ ...JSON.parse(JSON.stringify(candidate)), revision: 1 });
  });
});
