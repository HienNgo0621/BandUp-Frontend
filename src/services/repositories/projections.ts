import type { AccountView, ContentSummary, OwnedAttempt, OwnedForumPost, OwnedGrade, OwnedHistory, OwnedNote, OwnedStudyTask } from '../domain/contracts';
import type { User } from '../../types/user';
import type { QuestionBankSet } from '../../types/question-bank';
import type { AppNotification } from '../../types/notification';
import { finalizedResult } from '../domain/snapshotValidation';

// Explicit fields are intentional. Validators accept legacy extensions; ordinary
// reads must not expose them, credentials, recovery context or future answer keys.
export const accountView = (u: User): AccountView => ({
  id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, label: u.label,
  createdAt: u.createdAt, updatedAt: u.updatedAt,
  profile: u.profile === undefined ? undefined : {
    shortName: u.profile.shortName, label: u.profile.label, joinedAt: u.profile.joinedAt,
  },
});
export const contentSummary = (q: QuestionBankSet): ContentSummary => ({
  id: q.id, title: q.title, skill: q.skill, status: q.status, source: q.source,
  questionCount: q.questionCount, durationMinutes: q.durationMinutes, createdAt: q.createdAt, updatedAt: q.updatedAt,
});
export const noteView = (n: OwnedNote): OwnedNote => ({
  id: n.id, ownerId: n.ownerId, type: n.type, heading: n.heading, meaning: n.meaning,
  example: n.example, source: n.source, dateLabel: n.dateLabel,
  reference: n.reference === undefined ? undefined : {
    kind: n.reference.kind, title: n.reference.title, token: n.reference.token, question: n.reference.question,
  },
});
export const taskView = (t: OwnedStudyTask): OwnedStudyTask => ({
  id: t.id, ownerId: t.ownerId, title: t.title, skill: t.skill, minutes: t.minutes, done: t.done,
});
export const historyView = (h: OwnedHistory): OwnedHistory => ({
  id: h.id, ownerId: h.ownerId, userId: h.userId, title: h.title, skill: h.skill, timestamp: h.timestamp,
  durationSeconds: h.durationSeconds, score: h.score, createdAt: h.createdAt, updatedAt: h.updatedAt,
});
export const postView = (p: OwnedForumPost): OwnedForumPost => ({
  id: p.id, ownerId: p.ownerId, authorId: p.authorId, authorName: p.authorName, title: p.title, body: p.body,
  skill: p.skill, topicId: p.topicId, topicKey: p.topicKey, tags: [...p.tags], visibility: p.visibility, status: p.status,
  submissionId: p.submissionId, reactionCount: p.reactionCount, commentCount: p.commentCount, shareCount: p.shareCount,
  createdAt: p.createdAt, updatedAt: p.updatedAt,
});
export const gradeView = (g: OwnedGrade): OwnedGrade => ({
  id: g.id, ownerId: g.ownerId, submissionId: g.submissionId, teacherId: g.teacherId, bandScore: g.bandScore,
  feedback: g.feedback, rubricScores: g.rubricScores === undefined ? undefined : [...g.rubricScores],
  createdAt: g.createdAt, updatedAt: g.updatedAt,
});
export const notificationView = (n: AppNotification, viewerId: string): AppNotification => ({
  id: n.id, recipientId: n.recipientId, content: n.content, createdAt: n.createdAt, updatedAt: n.updatedAt,
  readBy: n.readBy.includes(viewerId) ? [viewerId] : [], relatedRoute: n.relatedRoute, relatedEntityId: n.relatedEntityId,
});
export function attemptView(a: OwnedAttempt): OwnedAttempt {
  // Detached known fields only; extensions cannot escape through nested arrays.
  const result = a.result === undefined ? undefined : {
    score: a.result.score, band: a.result.band, correct: a.result.correct,
    incorrect: a.result.incorrect, unanswered: a.result.unanswered,
    skillScores: a.result.skillScores === undefined ? undefined : Object.fromEntries(
      (['Reading', 'Listening', 'Writing', 'Speaking'] as const).flatMap((skill) => {
        const score = a.result?.skillScores?.[skill]; return score === undefined ? [] : [[skill, score]];
      })),
  };
  const common = {
    id: a.id, ownerId: a.ownerId, userId: a.userId, questionSetId: a.questionSetId, skill: a.skill,
    startedAt: a.startedAt, submittedAt: a.submittedAt, remainingSeconds: a.remainingSeconds,
    flaggedQuestionIds: [...a.flaggedQuestionIds],
    answers: a.answers.map((answer) => ({ questionId: answer.questionId,
      value: Array.isArray(answer.value) ? [...answer.value] : answer.value, updatedAt: answer.updatedAt })),
    createdAt: a.createdAt, updatedAt: a.updatedAt,
  };
  // Preserve the completed union through its accepted runtime guard.
  if (a.status === 'completed') {
    if (finalizedResult(result)) return { ...common, status: a.status, stage: a.stage, result };
    throw new Error('Invalid finalized projection');
  }
  return { ...common, status: a.status, stage: a.stage, result };
}
