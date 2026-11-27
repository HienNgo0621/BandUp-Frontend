import { failure, type Result, type SnapshotStorage } from '../domain/contracts';
import type { DomainSnapshot } from '../domain/schema';
import { isRecord, type StorageAdapter } from './localStorageService';
import { LEGACY_LOCAL_STORAGE_KEYS, STORAGE_KEYS } from './storageKeys';
import { containsCredentials, inspectSnapshot, prepareMigration, serializeSnapshot, type MigrationSummary } from './snapshotCodec';
import { createStorageAccess } from './typedStorageAccess';

// These are staging artifacts, never alternative writable domain sources.
export const SNAPSHOT_KEYS = {
  canonical: STORAGE_KEYS.appData,
  journal: 'bandup_snapshot_recovery_v1',
  candidate: 'bandup_snapshot_candidate_v1',
  sourceBackup: 'bandup_snapshot_source_v1',
  provenance: 'bandup_snapshot_initialized_v1',
} as const;
export interface PersistenceOptions {
  storage: () => StorageAdapter | null;
  keys?: { canonical: string; journal: string; candidate: string; sourceBackup: string; provenance?: string };
  digest?: (raw: string) => Promise<string>;
  // A future browser host may bridge storage events here. No listener is
  // installed against the real window by this staged module.
  listen?: (changed: (key: string | null) => void) => () => void;
}
interface Journal { format: 1; originalRaw: string | null; candidateHash: string; targetRevision: number }
export interface RecoveryStatus {
  state: 'none' | 'prepared' | 'incomplete' | 'committed' | 'orphan' | 'missing';
}
interface Recovery extends RecoveryStatus {
  journal?: Journal; journalRaw?: string; candidate?: string; canonical: string | null;
}
export interface CommitOutcome { revision: number; cleanupPending: boolean }
export type Initialization = { state: 'initialized' | 'existing'; revision: number } |
  { state: 'migration-pending'; sourceKeys: string[] };
export interface Invalidation { reason: 'commit' | 'external'; revision?: number }
export interface SnapshotPersistence extends SnapshotStorage {
  initialize(seed: () => unknown): Promise<Result<Initialization>>;
  migrate(): Promise<Result<CommitOutcome & { summary: MigrationSummary }>>;
  inspectRecovery(): Promise<Result<RecoveryStatus>>;
  recover(): Promise<Result<CommitOutcome>>;
  cancelPending(): Promise<Result<void>>;
  subscribe(listener: (event: Invalidation) => void): () => void;
  dispose(): void;
}
const conflict = () => failure('conflict', 'Your saved data changed. Reload before trying again.', true);
const recoveryRequired = () => failure('recovery-required', 'Your saved data needs recovery before saving can continue.');

async function sha256(raw: string): Promise<string> {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Purely opt-in, injected persistence. Does not import the live loader or seed. */
export function createSnapshotPersistence(options: PersistenceOptions): SnapshotPersistence {
  const access = createStorageAccess(options.storage);
  const keys = options.keys ? { ...options.keys, provenance: options.keys.provenance ?? `${options.keys.canonical}:initialized` } : SNAPSHOT_KEYS;
  if (new Set(Object.values(keys)).size !== 5) throw new Error('Snapshot keys must be distinct.');
  const digest = options.digest ?? sha256;
  const listeners = new Set<(event: Invalidation) => void>();
  let tail: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<Result<T>>): Promise<Result<T>> {
    const next = tail.then(operation); tail = next.catch(() => undefined); return next;
  }
  function emit(event: Invalidation) {
    for (const listener of listeners) { try { listener(event); } catch { /* A subscriber cannot undo a commit. */ } }
  }
  const stopListening = options.listen?.((key) => {
    if (key === null || key === keys.canonical) emit({ reason: 'external' });
  });
  async function hash(raw: string): Promise<Result<string>> {
    try {
      const value = await digest(raw);
      return /^[a-f0-9]{64}$/.test(value) ? { ok: true, value } : recoveryRequired();
    } catch { return failure('storage-unavailable', 'Safe saving is unavailable in this browser.', true); }
  }
  function legacySources(): Result<string[]> {
    const found: string[] = [];
    for (const key of [...LEGACY_LOCAL_STORAGE_KEYS, STORAGE_KEYS.migration]) {
      const read = access.read(key); if (!read.ok) return read;
      if (read.value !== null) found.push(key);
    }
    return { ok: true, value: found };
  }
  function clean(): Result<void> {
    const candidate = access.remove(keys.candidate); if (!candidate.ok) return candidate;
    return access.remove(keys.journal);
  }
  // No user data or timestamp: this only distinguishes a missing committed
  // snapshot from a new installation. Complete origin clearance erases it too.
  const provenanceRaw = '{"format":1}';
  function provenance(): Result<boolean> {
    const value = access.read(keys.provenance); if (!value.ok) return value;
    if (value.value !== null && value.value !== provenanceRaw) return recoveryRequired();
    return { ok: true, value: value.value !== null };
  }
  function establishProvenance(): Result<void> {
    const prior = provenance(); if (!prior.ok) return prior;
    return prior.value ? { ok: true, value: undefined } : access.write(keys.provenance, provenanceRaw);
  }
  async function recovery(): Promise<Result<Recovery>> {
    const canonical = access.read(keys.canonical); if (!canonical.ok) return canonical;
    const journalRaw = access.read(keys.journal); if (!journalRaw.ok) return journalRaw;
    const candidate = access.read(keys.candidate); if (!candidate.ok) return candidate;
    const initialized = provenance(); if (!initialized.ok) return initialized;
    if (journalRaw.value === null) {
      if (candidate.value === null) return { ok: true, value: { state: canonical.value === null && initialized.value ? 'missing' : 'none', canonical: canonical.value } };
      const active = canonical.value === null ? null : inspectSnapshot(canonical.value);
      if (candidate.value === canonical.value && active?.ok && active.value.version === 2)
        return { ok: true, value: { state: 'committed', canonical: canonical.value } };
      return { ok: true, value: { state: 'orphan', canonical: canonical.value } };
    }
    let value: unknown;
    try { value = JSON.parse(journalRaw.value); } catch { return recoveryRequired(); }
    if (!isRecord(value) || value.format !== 1 || (value.originalRaw !== null && typeof value.originalRaw !== 'string') ||
      typeof value.candidateHash !== 'string' || !/^[a-f0-9]{64}$/.test(value.candidateHash) ||
      !Number.isSafeInteger(value.targetRevision) || typeof value.targetRevision !== 'number' || value.targetRevision < 0)
      return recoveryRequired();
    const journal: Journal = { format: 1, originalRaw: value.originalRaw, candidateHash: value.candidateHash, targetRevision: value.targetRevision };
    let originalRevision = -1;
    if (journal.originalRaw !== null) {
      const original = inspectSnapshot(journal.originalRaw); if (!original.ok) return original;
      if (containsCredentials(original.value.value)) return recoveryRequired();
      originalRevision = original.value.version === 2 ? original.value.snapshot.revision : -1;
    }
    if (journal.targetRevision !== originalRevision + 1) return recoveryRequired();
    if (journal.originalRaw !== null && originalRevision === -1) {
      const backup = access.read(keys.sourceBackup); if (!backup.ok) return backup;
      // A failed initial backup can leave a journal but must never permit activation.
      if (backup.value !== journal.originalRaw)
        return { ok: true, value: { state: 'incomplete', canonical: canonical.value, journal, journalRaw: journalRaw.value } };
    }
    const base = { canonical: canonical.value, journal, journalRaw: journalRaw.value };
    if (canonical.value !== null) {
      const active = inspectSnapshot(canonical.value); if (!active.ok) return active;
      const activeHash = await hash(canonical.value); if (!activeHash.ok) return activeHash;
      if (activeHash.value === journal.candidateHash && active.value.version === 2 && active.value.snapshot.revision === journal.targetRevision)
        return { ok: true, value: { ...base, state: 'committed' } };
    }
    if (canonical.value !== journal.originalRaw) return conflict();
    if (candidate.value !== null) {
      const candidateHash = await hash(candidate.value); if (!candidateHash.ok) return candidateHash;
      const parsed = inspectSnapshot(candidate.value);
      if (candidateHash.value === journal.candidateHash && parsed.ok && parsed.value.version === 2 &&
        parsed.value.snapshot.revision === journal.targetRevision && !containsCredentials(parsed.value.value))
        return { ok: true, value: { ...base, state: 'prepared', candidate: candidate.value } };
    }
    return { ok: true, value: { ...base, state: 'incomplete' } };
  }
  async function clearCommitted(): Promise<Result<void>> {
    const pending = await recovery(); if (!pending.ok) return pending;
    if (pending.value.state === 'none') return { ok: true, value: undefined };
    if (pending.value.state === 'committed') {
      const marked = establishProvenance(); if (!marked.ok) return marked;
      const stable = unchanged(pending.value.canonical); return stable.ok ? clean() : stable;
    }
    return recoveryRequired();
  }
  function fresh(resuming = false): Result<void> {
    const current = access.read(keys.canonical); if (!current.ok) return current;
    if (current.value !== null) return conflict();
    const legacy = legacySources(); if (!legacy.ok) return legacy;
    const backup = access.read(keys.sourceBackup); if (!backup.ok) return backup;
    if (backup.value !== null) return recoveryRequired();
    const initialized = provenance(); if (!initialized.ok) return initialized;
    if (initialized.value && !resuming) return recoveryRequired();
    return legacy.value.length ? failure('migration-pending', 'Existing saved data needs review before setup can continue.') : { ok: true, value: undefined };
  }
  function unchanged(original: string | null, resuming = false): Result<void> {
    const current = access.read(keys.canonical); if (!current.ok) return current;
    if (current.value !== original) return conflict();
    return original === null ? fresh(resuming) : { ok: true, value: undefined };
  }
  async function commit(original: string | null, candidate: DomainSnapshot, nextRevision?: number): Promise<Result<CommitOutcome>> {
    // Inspect the original root before copying it: a spread would erase a
    // non-enumerable root hook before the JSON boundary could reject it.
    const prepared = serializeSnapshot(candidate); if (!prepared.ok) return prepared;
    const encoded = nextRevision === undefined ? prepared : serializeSnapshot({ ...JSON.parse(prepared.value), revision: nextRevision });
    if (!encoded.ok) return encoded;
    const valid = inspectSnapshot(encoded.value); if (!valid.ok) return valid;
    const revision = valid.value.snapshot.revision;
    if (valid.value.version !== 2 || containsCredentials(valid.value.value) ||
      (original !== null && containsCredentials(JSON.parse(original))))
      return failure('migration-pending', 'Account data needs review before safe storage migration can continue.');
    const candidateHash = await hash(encoded.value); if (!candidateHash.ok) return candidateHash;
    const cleared = await clearCommitted(); if (!cleared.ok) return cleared;
    const check = unchanged(original); if (!check.ok) return check;
    const journal: Journal = { format: 1, originalRaw: original, candidateHash: candidateHash.value, targetRevision: revision };
    const journalRaw = JSON.stringify(journal);
    const backup = access.write(keys.journal, journalRaw); if (!backup.ok) return backup;
    if (original !== null && JSON.parse(original).schemaVersion === 1) {
      const source = access.read(keys.sourceBackup); if (!source.ok) return source;
      if (source.value !== null && source.value !== original) return recoveryRequired();
      if (source.value === null) {
        const preserved = access.write(keys.sourceBackup, original); if (!preserved.ok) return preserved;
      }
    }
    const staged = access.write(keys.candidate, encoded.value); if (!staged.ok) return staged;
    const checked = unchanged(original); if (!checked.ok) return checked;
    const savedJournal = access.read(keys.journal); if (!savedJournal.ok) return savedJournal;
    const savedCandidate = access.read(keys.candidate); if (!savedCandidate.ok) return savedCandidate;
    if (savedJournal.value !== journalRaw || savedCandidate.value !== encoded.value) return conflict();
    if (original !== null && JSON.parse(original).schemaVersion === 1) {
      const retained = access.read(keys.sourceBackup); if (!retained.ok) return retained;
      if (retained.value !== original) return recoveryRequired();
    }
    const marked = establishProvenance(); if (!marked.ok) return marked;
    const finalSource = unchanged(original, true); if (!finalSource.ok) return finalSource;
    // Best-effort revision check, not atomic cross-context compare-and-swap.
    const activated = access.write(keys.canonical, encoded.value); if (!activated.ok) return activated;
    emit({ reason: 'commit', revision });
    const cleaned = clean();
    return { ok: true, value: { revision, cleanupPending: !cleaned.ok } };
  }
  async function read(): Promise<Result<unknown | null>> {
    const raw = access.read(keys.canonical); if (!raw.ok) return raw;
    if (raw.value === null) {
      const initialized = provenance(); if (!initialized.ok) return initialized;
      return initialized.value ? recoveryRequired() : raw;
    }
    const valid = inspectSnapshot(raw.value); if (!valid.ok) return valid;
    return { ok: true, value: valid.value.value };
  }
  return {
    read,
    initialize: (seed) => serial<Initialization>(async () => {
      const pending = await clearCommitted(); if (!pending.ok) return pending;
      const raw = access.read(keys.canonical); if (!raw.ok) return raw;
      if (raw.value !== null) {
        const valid = inspectSnapshot(raw.value); if (!valid.ok) return valid;
        const marked = establishProvenance(); if (!marked.ok) return marked;
        const stable = unchanged(raw.value); if (!stable.ok) return stable;
        return valid.value.version === 2
          ? { ok: true, value: { state: 'existing', revision: valid.value.snapshot.revision } }
          : { ok: true, value: { state: 'migration-pending', sourceKeys: [keys.canonical] } };
      }
      const legacy = legacySources(); if (!legacy.ok) return legacy;
      if (legacy.value.length) return { ok: true, value: { state: 'migration-pending', sourceKeys: legacy.value } };
      const preserved = access.read(keys.sourceBackup); if (!preserved.ok) return preserved;
      if (preserved.value !== null) return recoveryRequired();
      let seedValue: unknown;
      try { seedValue = seed(); } catch { return failure('invalid-snapshot', 'Initial data could not be prepared.'); }
      const encoded = serializeSnapshot(seedValue); if (!encoded.ok) return encoded;
      const valid = inspectSnapshot(encoded.value); if (!valid.ok) return valid;
      if (valid.value.version !== 2 || valid.value.snapshot.revision !== 0) return failure('invalid-snapshot', 'Initial data could not be verified.');
      const saved = await commit(null, valid.value.snapshot); if (!saved.ok) return saved;
      return { ok: true, value: { state: 'initialized', revision: saved.value.revision } };
    }),
    migrate: () => serial(async () => {
      const raw = access.read(keys.canonical); if (!raw.ok) return raw;
      if (raw.value === null) {
        const initialized = provenance(); if (!initialized.ok) return initialized;
        return initialized.value ? recoveryRequired() : failure('migration-pending', 'Existing saved data needs review before migration can continue.');
      }
      const valid = inspectSnapshot(raw.value); if (!valid.ok) return valid;
      const prepared = prepareMigration(raw.value); if (!prepared.ok) return prepared;
      if (valid.value.version === 2) {
        const cleared = await clearCommitted(); if (!cleared.ok) return cleared;
        const marked = establishProvenance(); if (!marked.ok) return marked;
        const stable = unchanged(raw.value); if (!stable.ok) return stable;
        return { ok: true, value: { revision: prepared.value.snapshot.revision, cleanupPending: false, summary: prepared.value.summary } };
      }
      const committed = await commit(raw.value, prepared.value.snapshot); if (!committed.ok) return committed;
      return { ok: true, value: { ...committed.value, summary: prepared.value.summary } };
    }),
    compareAndSwap: (expected, candidate) => serial(async () => {
      const raw = access.read(keys.canonical); if (!raw.ok) return raw;
      if (raw.value === null) { if (expected !== null) return conflict(); }
      else {
        const valid = inspectSnapshot(raw.value); if (!valid.ok) return valid;
        if (valid.value.version !== 2) return failure('migration-pending', 'Your saved data must be migrated before saving.');
        if (valid.value.snapshot.revision !== expected) return conflict();
      }
      const revision = expected === null ? 0 : expected + 1;
      if (!Number.isSafeInteger(revision) || revision < 0) return conflict();
      const result = await commit(raw.value, candidate, revision);
      return result.ok ? { ok: true, value: undefined } : result;
    }),
    inspectRecovery: async () => {
      const state = await recovery(); return state.ok ? { ok: true, value: { state: state.value.state } } : state;
    },
    recover: () => serial(async () => {
      const state = await recovery(); if (!state.ok) return state;
      if (state.value.state === 'committed') {
        const active = state.value.canonical && inspectSnapshot(state.value.canonical);
        if (!active || !active.ok) return recoveryRequired();
        const marked = establishProvenance(); if (!marked.ok) return marked;
        const stable = unchanged(state.value.canonical); if (!stable.ok) return stable;
        const cleaned = clean();
        emit({ reason: 'commit', revision: active.value.snapshot.revision });
        return { ok: true, value: { revision: active.value.snapshot.revision, cleanupPending: !cleaned.ok } };
      }
      if (state.value.state !== 'prepared' || !state.value.journal || !state.value.candidate) return recoveryRequired();
      const check = unchanged(state.value.journal.originalRaw, true); if (!check.ok) return check;
      const journal = access.read(keys.journal); if (!journal.ok) return journal;
      const staged = access.read(keys.candidate); if (!staged.ok) return staged;
      if (journal.value !== state.value.journalRaw || staged.value !== state.value.candidate) return conflict();
      const marked = establishProvenance(); if (!marked.ok) return marked;
      const finalSource = unchanged(state.value.journal.originalRaw, true); if (!finalSource.ok) return finalSource;
      const saved = access.write(keys.canonical, state.value.candidate); if (!saved.ok) return saved;
      emit({ reason: 'commit', revision: state.value.journal.targetRevision });
      const cleaned = clean();
      return { ok: true, value: { revision: state.value.journal.targetRevision, cleanupPending: !cleaned.ok } };
    }),
    cancelPending: () => serial(async () => {
      const state = await recovery(); if (!state.ok) return state;
      if (state.value.state === 'none') return { ok: true, value: undefined };
      if (!state.value.journal || state.value.canonical !== state.value.journal.originalRaw) return recoveryRequired();
      const check = unchanged(state.value.journal.originalRaw, true); if (!check.ok) return check;
      return clean();
    }),
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose: () => { stopListening?.(); listeners.clear(); },
  };
}
