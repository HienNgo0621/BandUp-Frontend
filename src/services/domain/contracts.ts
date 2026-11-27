import type { AppRole, Skill } from '../../types/common';
import type { User, UserProfile } from '../../types/user';
import type { LearningHistory, LearningNote, StudyTask } from '../../types/learning';
import type { ExamAnswer, ExamResult, ExamSession } from '../../types/exam';
import type { Submission, SubmissionVisibility } from '../../types/submission';
import type { ForumPost } from '../../types/forum';
import type { GradingRecord } from '../../types/grading';
import type { AppNotification } from '../../types/notification';
import type { VolunteerApplication } from '../../types/application';
import type { QuestionBankSet } from '../../types/question-bank';
import type { DomainSnapshot } from './schema';

export type DomainErrorCode = 'unauthenticated' | 'forbidden' | 'not-found' | 'validation' |
  'invalid-state' | 'conflict' | 'storage-unavailable' | 'corrupt-data' | 'unsupported-schema' |
  'invalid-json' | 'invalid-snapshot' | 'storage-read-failed' | 'storage-write-failed' |
  'serialization-failed' | 'migration-pending' | 'recovery-required';
export interface DomainError { code: DomainErrorCode; message: string; retryable: boolean }
export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };
export const failure = (code: DomainErrorCode, message: string, retryable = false): Result<never> =>
  ({ ok: false, error: { code, message, retryable } });

export interface OwnedRecord { id: string; ownerId: string }
export type OwnedNote = Omit<LearningNote, 'id'> & OwnedRecord;
export type OwnedStudyTask = Omit<StudyTask, 'id'> & OwnedRecord;
export type OwnedHistory = LearningHistory & OwnedRecord;
type NonEmptySkillScores = { [K in Skill]: Record<K, number> & Partial<Record<Exclude<Skill, K>, number>> }[Skill];
// The legacy UI session type permits an empty result. The staged completed
// contract requires actual result data; it does not invent a scoring formula.
export type FinalizedExamResult = ExamResult & ({ score: number } | { band: number } | { correct: number } |
  { incorrect: number } | { unanswered: number } | { skillScores: NonEmptySkillScores });
export type OwnedAttempt = Omit<ExamSession, 'status' | 'stage' | 'result'> & OwnedRecord & (
  { status: 'completed'; stage: 'Completed'; result: FinalizedExamResult } |
  { status: Exclude<ExamSession['status'], 'completed'>; stage: ExamSession['stage']; result?: ExamResult }
);
export type OwnedSubmission = Submission & OwnedRecord;
export type OwnedForumPost = ForumPost & OwnedRecord;
export type OwnedGrade = GradingRecord & OwnedRecord;
export type OwnedApplication = VolunteerApplication & OwnedRecord;
export type AccountView = Omit<User, 'profile'> & { profile?: Pick<UserProfile, 'shortName' | 'label' | 'joinedAt'> };
export type ContentSummary = Omit<QuestionBankSet, 'sections'>;

// An adapter resolves/revalidates the session itself on EVERY call. Caller-supplied
// ownerId/role is never authorization. Client mocks are not a security boundary.
export interface Principal { userId: string; role: AppRole }
export interface WriteOptions { expectedRevision: number; operationId: string }
export interface Commit<T> { value: T; revision: number }
export type WriteResult<T> = Promise<Result<Commit<T>>>;
export interface UserRepository {
  me(): Promise<Result<AccountView>>;
  updateProfile(input: Pick<User, 'name'>, options: WriteOptions): WriteResult<AccountView>;
  setStatus(userId: string, status: 'active' | 'blocked', options: WriteOptions): WriteResult<AccountView>;
}
export interface LearningRepository {
  notes(): Promise<Result<OwnedNote[]>>;
  plan(): Promise<Result<Record<string, OwnedStudyTask[]>>>;
  history(): Promise<Result<OwnedHistory[]>>;
  setTaskDone(taskId: string, done: boolean, options: WriteOptions): WriteResult<OwnedStudyTask>;
}
export interface AttemptRepository {
  get(attemptId: string): Promise<Result<OwnedAttempt>>;
  saveAnswers(attemptId: string, answers: ExamAnswer[], options: WriteOptions): WriteResult<OwnedAttempt>;
  // Coupled attempt/result/history commit; repeated operationId returns the same
  // finalized result. The adapter, not the caller, calculates authoritative scores.
  submit(attemptId: string, options: WriteOptions): WriteResult<OwnedAttempt>;
}
export interface ContentRepository { published(): Promise<Result<ContentSummary[]>> }
export interface ForumRepository {
  list(): Promise<Result<OwnedForumPost[]>>;
  get(postId: string): Promise<Result<OwnedForumPost>>;
  // Post and linked submission visibility must change in one commit.
  setVisibility(postId: string, visibility: SubmissionVisibility, options: WriteOptions): WriteResult<OwnedForumPost>;
}
export interface GradingRepository {
  mine(): Promise<Result<OwnedGrade[]>>;
  forSubmission(submissionId: string): Promise<Result<OwnedGrade[]>>;
}
export interface NotificationRepository {
  mine(): Promise<Result<AppNotification[]>>;
  markRead(notificationId: string, options: WriteOptions): WriteResult<AppNotification>;
  markAllRead(options: WriteOptions): WriteResult<number>;
}
export interface ApplicationRepository {
  // Applicant identity/proof contract is pending; email and application ID alone
  // must not authorize a read. No invented applicant authentication flow here.
  pendingReview(): Promise<Result<VolunteerApplication[]>>;
  decide(applicationId: string, decision: 'approved' | 'rejected', reason: string,
    options: WriteOptions): WriteResult<OwnedApplication>;
}
export interface DomainRepositories {
  users: UserRepository; learning: LearningRepository; attempts: AttemptRepository;
  content: ContentRepository; forum: ForumRepository; grading: GradingRepository;
  notifications: NotificationRepository; applications: ApplicationRepository;
  // Invalidation fires only after a verified commit; refresh also on account
  // switches and external storage events. Unsubscribe prevents stale consumers.
  subscribe(onInvalidated: () => void): () => void;
}
export interface SnapshotStorage {
  read(): Promise<Result<unknown | null>>;
  // One atomic envelope write, checked against the previous revision. A local
  // adapter must report unsupported cross-tab CAS, never promise server locking.
  compareAndSwap(expectedRevision: number | null, snapshot: DomainSnapshot): Promise<Result<void>>;
}
