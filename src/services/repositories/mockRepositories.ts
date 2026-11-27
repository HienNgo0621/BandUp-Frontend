import { failure, type Commit, type DomainError, type DomainErrorCode, type DomainRepositories, type Principal, type Result, type WriteOptions } from '../domain/contracts';
import type { DomainSnapshot } from '../domain/schema';
import type { AppRole } from '../../types/common';
import type { AppNotification } from '../../types/notification';
import { canReadForumPost, canReadForumVisibility } from '../domain/forumPolicy';
import { id } from '../domain/snapshotValidation';
import { inspectSnapshot, serializeSnapshot } from '../storage/snapshotCodec';
import type { SnapshotPersistence } from '../storage/snapshotPersistence';
import { isRecord } from '../storage/localStorageService';
import { accountView, attemptView, contentSummary, gradeView, historyView, noteView, notificationView, postView, taskView } from './projections';

export type MockOperation = 'users.me' | 'users.updateProfile' | 'users.setStatus' |
  'learning.notes' | 'learning.plan' | 'learning.history' | 'learning.setTaskDone' |
  'attempts.get' | 'attempts.saveAnswers' | 'attempts.submit' | 'content.published' |
  'forum.list' | 'forum.get' | 'forum.setVisibility' | 'grading.mine' | 'grading.forSubmission' |
  'notifications.mine' | 'notifications.markRead' | 'notifications.markAllRead' | 'applications.pendingReview' | 'applications.decide';
export interface MockRepositoryOptions {
  storage: Pick<SnapshotPersistence, 'read' | 'compareAndSwap' | 'subscribe'>;
  // Configured by application composition, never by an operation's caller.
  resolvePrincipal: () => Principal | null | Promise<Principal | null>;
  failures?: Partial<Record<MockOperation, DomainErrorCode>>;
}
interface Context { snapshot: DomainSnapshot; principal: Principal | null }
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const denied = () => failure('forbidden', 'You do not have permission to access this information.');
const missing = () => failure('not-found', 'This item is unavailable.');
const invalid = () => failure('validation', 'Check the supplied information and try again.');
const changed = () => failure('conflict', 'Your account or saved data changed. Please try again.', true);
const notSupported = () => failure('unsupported', 'This action is not available yet.');
const storageFailure = (error: DomainError, writing = false) => failure(error.code,
  error.code === 'conflict' ? 'Your saved data changed. Please try again.' : writing
    ? 'Your changes could not be saved. Please try again.' : 'Your saved data could not be read. Please try again.', error.retryable);

/** Opt-in and stateless: no live auth, storage acquisition, seed or migration. */
export function createMockRepositories(options: MockRepositoryOptions): DomainRepositories {
  async function principal(): Promise<Result<Principal | null>> {
    try {
      const value = await options.resolvePrincipal();
      if (value === null) return ok(null);
      if (!value || !id(value.userId) || !['student', 'teacher', 'admin'].includes(value.role)) return denied();
      return ok({ userId: value.userId, role: value.role });
    } catch { return failure('unauthenticated', 'Please sign in to continue.'); }
  }
  const same = (a: Principal | null, b: Principal | null) => a?.userId === b?.userId && a?.role === b?.role;
  async function stillCurrent(context: Context): Promise<Result<void>> {
    const current = await principal(); if (!current.ok) return current;
    return same(current.value, context.principal) ? ok(undefined) : changed();
  }
  async function load(operation: MockOperation, roles?: readonly AppRole[], publicRead = false): Promise<Result<Context>> {
    const before = await principal(); if (!before.ok) return before;
    if (before.value === null && !publicRead) return failure('unauthenticated', 'Please sign in to continue.');
    if (before.value && roles && !roles.includes(before.value.role)) return denied();
    if (options.failures?.[operation]) return failure(options.failures[operation], 'This action could not be completed. Please try again.');
    let raw: Awaited<ReturnType<MockRepositoryOptions['storage']['read']>>;
    try { raw = await options.storage.read(); }
    catch { return failure('storage-read-failed', 'Your saved data could not be read. Please try again.', true); }
    if (!raw.ok) return storageFailure(raw.error);
    if (raw.value === null) return failure('not-ready', 'Your saved data is not ready yet.');
    const encoded = serializeSnapshot(raw.value); if (!encoded.ok) return encoded;
    const valid = inspectSnapshot(encoded.value); if (!valid.ok) return valid;
    if (valid.value.version !== 2) return failure('migration-pending', 'Your saved data needs review before continuing.');
    const snapshot = valid.value.snapshot;
    if (before.value) {
      const user = snapshot.users.find((u) => u.id === before.value?.userId);
      if (!user || user.role !== before.value.role || !['active', 'muted'].includes(user.status)) return denied();
    }
    const context = { snapshot, principal: before.value };
    const current = await stillCurrent(context); return current.ok ? ok(context) : current;
  }
  const visibleNotification = (n: AppNotification, p: Principal) => n.recipientId === p.userId || n.recipientId === `all:${p.role}`;
  async function read<T>(operation: MockOperation, roles: readonly AppRole[] | undefined, select: (context: Context) => Result<T>, publicRead = false): Promise<Result<T>> {
    const context = await load(operation, roles, publicRead);
    return context.ok ? select(context.value) : context;
  }
  function writeOptions(value: WriteOptions, snapshot: DomainSnapshot): Result<WriteOptions> {
    const encoded = serializeSnapshot(value); if (!encoded.ok) return invalid();
    const parsed: unknown = JSON.parse(encoded.value);
    if (!isRecord(parsed) || typeof parsed.expectedRevision !== 'number' || !Number.isSafeInteger(parsed.expectedRevision) ||
      parsed.expectedRevision < 0 || !id(parsed.operationId) || Object.keys(parsed).some((key) => !['expectedRevision', 'operationId'].includes(key))) return invalid();
    return snapshot.revision === parsed.expectedRevision ? ok({ expectedRevision: parsed.expectedRevision, operationId: parsed.operationId }) : changed();
  }
  async function save<T>(context: Context, write: WriteOptions, value: T, dirty: boolean): Promise<Result<Commit<T>>> {
    const revision = writeOptions(write, context.snapshot); if (!revision.ok) return revision;
    const current = await stillCurrent(context); if (!current.ok) return current;
    if (!dirty) return ok({ value, revision: context.snapshot.revision });
    let committed: Result<void>;
    try { committed = await options.storage.compareAndSwap(revision.value.expectedRevision, context.snapshot); }
    catch { return failure('storage-write-failed', 'Your changes could not be saved. Please try again.', true); }
    if (!committed.ok) return storageFailure(committed.error, true);
    // A completed commit cannot be undone on account switch. Do not return the
    // former account's projection to the new account; its actual storage event
    // remains factual invalidation, not a fabricated successful operation.
    const after = await stillCurrent(context); if (!after.ok) return after;
    return ok({ value, revision: revision.value.expectedRevision + 1 });
  }
  async function unsupported(operation: MockOperation, roles: readonly AppRole[], target?: { collection: 'attempts' | 'forumPosts'; id: string }): Promise<Result<never>> {
    const context = await load(operation, roles); if (!context.ok) return context;
    if (target) {
      if (!id(target.id)) return invalid();
      const row = context.value.snapshot[target.collection].find((item) => item.id === target.id && item.ownerId === context.value.principal?.userId);
      if (!row) return missing();
    }
    return notSupported();
  }
  return {
    users: {
      me: () => read('users.me', undefined, ({ snapshot, principal: p }) => {
        const user = snapshot.users.find((u) => u.id === p?.userId); return user ? ok(accountView(user)) : missing();
      }),
      updateProfile: async (input, write) => {
        const context = await load('users.updateProfile'); if (!context.ok) return context;
        const encoded = serializeSnapshot(input); if (!encoded.ok) return invalid();
        const parsed: unknown = JSON.parse(encoded.value);
        if (!isRecord(parsed) || typeof parsed.name !== 'string' || !parsed.name.trim() || Object.keys(parsed).some((key) => key !== 'name')) return invalid();
        const user = context.value.snapshot.users.find((u) => u.id === context.value.principal?.userId); if (!user) return missing();
        const name = parsed.name.trim(); const dirty = user.name !== name; user.name = name;
        return save(context.value, write, accountView(user), dirty);
      },
      setStatus: () => unsupported('users.setStatus', ['admin']),
    },
    learning: {
      notes: () => read('learning.notes', ['student'], ({ snapshot, principal: p }) => ok(snapshot.notes.filter((n) => n.ownerId === p?.userId).map(noteView))),
      plan: () => read('learning.plan', ['student'], ({ snapshot, principal: p }) => ok(Object.fromEntries(Object.entries(snapshot.studyPlan).flatMap(([day, tasks]) => {
        const owned = tasks.filter((t) => t.ownerId === p?.userId).map(taskView); return owned.length ? [[day, owned]] : [];
      })))),
      history: () => read('learning.history', ['student'], ({ snapshot, principal: p }) => ok(snapshot.practiceHistory.filter((h) => h.ownerId === p?.userId).map(historyView))),
      setTaskDone: async (taskId, done, write) => {
        const context = await load('learning.setTaskDone', ['student']); if (!context.ok) return context;
        if (!id(taskId) || typeof done !== 'boolean') return invalid();
        const task = Object.values(context.value.snapshot.studyPlan).flat().find((t) => t.id === taskId && t.ownerId === context.value.principal?.userId);
        if (!task) return missing();
        const dirty = task.done !== done; task.done = done; return save(context.value, write, taskView(task), dirty);
      },
    },
    attempts: {
      get: (attemptId) => read('attempts.get', ['student'], ({ snapshot, principal: p }) => {
        if (!id(attemptId)) return invalid(); const attempt = snapshot.attempts.find((a) => a.id === attemptId && a.ownerId === p?.userId);
        return attempt ? ok(attemptView(attempt)) : missing();
      }),
      saveAnswers: (attemptId) => unsupported('attempts.saveAnswers', ['student'], { collection: 'attempts', id: attemptId }),
      submit: (attemptId) => unsupported('attempts.submit', ['student'], { collection: 'attempts', id: attemptId }),
    },
    content: { published: () => read('content.published', undefined,
      ({ snapshot }) => ok(snapshot.questionBank.filter((q) => q.status === 'Published').map(contentSummary)), true) },
    forum: {
      list: () => read('forum.list', undefined, ({ snapshot, principal: p }) => ok(snapshot.forumPosts
        .filter((post) => canReadForumPost(p?.role ?? 'guest', p?.userId ?? null, post)).map(postView)), true),
      get: (postId) => read('forum.get', undefined, ({ snapshot, principal: p }) => {
        if (!id(postId)) return invalid();
        const post = snapshot.forumPosts.find((row) => row.id === postId && canReadForumPost(p?.role ?? 'guest', p?.userId ?? null, row));
        return post ? ok(postView(post)) : missing();
      }, true),
      setVisibility: (postId) => unsupported('forum.setVisibility', ['student', 'teacher', 'admin'], { collection: 'forumPosts', id: postId }),
    },
    grading: {
      mine: () => read('grading.mine', ['teacher'], ({ snapshot, principal: p }) => ok(snapshot.grading.filter((g) => g.ownerId === p?.userId).map(gradeView))),
      forSubmission: (submissionId) => read('grading.forSubmission', ['student', 'teacher'], ({ snapshot, principal: p }) => {
        if (!id(submissionId)) return invalid();
        const submission = snapshot.submissions.find((s) => s.id === submissionId); if (!submission || !p) return missing();
        if (p.role === 'student' ? submission.ownerId !== p.userId : !canReadForumVisibility(p.role, p.userId, submission.studentId, submission.visibility)) return missing();
        return ok(snapshot.grading.filter((g) => g.submissionId === submissionId && (p.role === 'student' || g.ownerId === p.userId)).map(gradeView));
      }),
    },
    notifications: {
      mine: () => read('notifications.mine', undefined, ({ snapshot, principal: p }) => ok(p ? snapshot.notifications.filter((n) => visibleNotification(n, p)).map((n) => notificationView(n, p.userId)) : [])),
      markRead: async (notificationId, write) => {
        const context = await load('notifications.markRead'); if (!context.ok) return context;
        if (!id(notificationId)) return invalid(); const p = context.value.principal; if (!p) return denied();
        const notification = context.value.snapshot.notifications.find((n) => n.id === notificationId && visibleNotification(n, p)); if (!notification) return missing();
        const dirty = !notification.readBy.includes(p.userId); if (dirty) notification.readBy.push(p.userId);
        return save(context.value, write, notificationView(notification, p.userId), dirty);
      },
      markAllRead: async (write) => {
        const context = await load('notifications.markAllRead'); if (!context.ok) return context;
        const p = context.value.principal; if (!p) return denied(); let count = 0;
        for (const notification of context.value.snapshot.notifications) {
          if (visibleNotification(notification, p) && !notification.readBy.includes(p.userId)) { notification.readBy.push(p.userId); count++; }
        }
        return save(context.value, write, count, count > 0);
      },
    },
    applications: {
      pendingReview: () => unsupported('applications.pendingReview', ['admin']),
      decide: () => unsupported('applications.decide', ['admin']),
    },
    subscribe: (listener) => options.storage.subscribe(() => { try { listener(); } catch { /* Subscribers do not change persistence results. */ } }),
  };
}
