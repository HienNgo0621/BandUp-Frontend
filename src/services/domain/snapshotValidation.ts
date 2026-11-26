import { isRecord } from '../storage/localStorageService';
import type { JsonValue, Skill } from '../../types/common';
import type { User, UserProfile } from '../../types/user';
import type { PracticeQuestion, PracticeSection, QuestionGroup } from '../../types/practice';
import type { QuestionBankSet } from '../../types/question-bank';
import type { ExamAnswer, ExamResult, ExamSession } from '../../types/exam';
import type { LearningHistory, LearningNote, StudyTask } from '../../types/learning';
import type { ForumComment, ForumPost, ForumReport, ForumTopic } from '../../types/forum';
import type { Submission } from '../../types/submission';
import type { GradingRecord } from '../../types/grading';
import type { VolunteerApplication } from '../../types/application';
import type { Registration } from '../../types/registration';
import type { AppNotification } from '../../types/notification';
import type { FinalizedExamResult } from './contracts';
import type { MigrationReview } from './schema';

export type Guard<T> = (value: unknown) => value is T;
export const text: Guard<string> = (v): v is string => typeof v === 'string';
export const id: Guard<string> = (v): v is string => text(v) && v.trim().length > 0;
export const number: Guard<number> = (v): v is number => typeof v === 'number' && Number.isFinite(v);
const bool: Guard<boolean> = (v): v is boolean => typeof v === 'boolean';
const optional = <T>(guard: Guard<T>): Guard<T | undefined> => (v): v is T | undefined => v === undefined || guard(v);
const nullable = <T>(guard: Guard<T>): Guard<T | null> => (v): v is T | null => v === null || guard(v);
const array = <T>(guard: Guard<T>): Guard<T[]> => (v): v is T[] => Array.isArray(v) && v.every(guard);
const record = <T>(guard: Guard<T>): Guard<Record<string, T>> => (v): v is Record<string, T> => isRecord(v) && Object.values(v).every(guard);
const oneOf = <const T extends readonly string[]>(...values: T): Guard<T[number]> =>
  (v): v is T[number] => text(v) && values.includes(v);
// Every declared field (including optional nested fields) needs a validator.
// The only key assertion is confined to iterating this compile-time checked map.
function shape<T extends object>(fields: { [K in keyof T]-?: Guard<T[K]> }): Guard<T> {
  return (v): v is T => isRecord(v) && (Object.keys(fields) as (keyof T & string)[]).every((key) => fields[key](v[key]));
}
export const json: Guard<JsonValue> = (v): v is JsonValue => v === null || text(v) || bool(v) || number(v) ||
  (Array.isArray(v) ? v.every(json) : isRecord(v) && Object.values(v).every(json));
export const jsonRecord = record(json);
const profileFields = shape<Pick<UserProfile, 'shortName' | 'label' | 'joinedAt' | 'details'>>({
  shortName: optional(text), label: optional(text), joinedAt: optional(number), details: optional(jsonRecord),
});
const profile: Guard<UserProfile> = (v): v is UserProfile => profileFields(v) && isRecord(v) &&
  Object.values(v).every((field) => field === undefined || json(field));
const timestamps = { createdAt: optional(number), updatedAt: optional(number) };
const skill = oneOf('Reading', 'Listening', 'Writing', 'Speaking');
const practiceSkill = oneOf('Reading', 'Listening', 'Writing', 'Speaking', 'Mock Test');
const visibility = oneOf('PUBLIC', 'TEACHER_ONLY', 'ONLY_ME');
const strings = array(text);
const question = shape<PracticeQuestion>({ id, number, prompt: text, options: optional(strings),
  answerKey: optional((v): v is string | string[] => text(v) || strings(v)), acceptedAnswers: optional(strings), explanation: optional(text) });
const group = shape<QuestionGroup>({ id, type: oneOf('Multiple Choice', 'True / False / Not Given', 'Yes / No / Not Given',
  'Form Completion', 'Note Completion', 'Sentence Completion', 'Matching Information', 'Matching Headings', 'Short Answer', 'Other'),
  startQuestionNumber: number, questions: array(question) });
const section = shape<PracticeSection>({ id, title: text, instructions: optional(text), content: optional(text), groups: array(group) });
const sections = array(section);
const reference = shape<NonNullable<LearningNote['reference']>>({ kind: text, title: text, token: optional(text), question: optional(number) });
const rubricScores = array(number);
const answer = shape<ExamAnswer>({ questionId: id, updatedAt: number, value: (v): v is string | string[] => text(v) || strings(v) });
const skillScores: Guard<Partial<Record<Skill, number>>> = (v): v is Partial<Record<Skill, number>> =>
  isRecord(v) && Object.entries(v).every(([key, value]) => skill(key) && number(value));
const result = shape<ExamResult>({ score: optional(number), band: optional(number), correct: optional(number),
  incorrect: optional(number), unanswered: optional(number), skillScores: optional(skillScores) });
export const finalizedResult = (v: unknown): v is FinalizedExamResult => result(v) &&
  ([v.score, v.band, v.correct, v.incorrect, v.unanswered].some(number) || Object.keys(v.skillScores ?? {}).length > 0);
export const guards = {
  users: shape<User>({ id, name: text, role: oneOf('student', 'teacher', 'admin'),
    status: oneOf('active', 'blocked', 'muted', 'pending', 'unknown'), label: text, email: optional(text), profile: optional(profile), ...timestamps }),
  notes: shape<Omit<LearningNote, 'id'> & { id: string }>({ id, type: oneOf('Vocabulary', 'Grammar', 'Mistake', 'Other'), heading: text,
    meaning: text, example: optional(text), source: optional(text), dateLabel: optional(text), reference: optional(reference) }),
  task: shape<Omit<StudyTask, 'id'> & { id: string }>({ id, title: text, skill: oneOf('Reading', 'Listening', 'Writing', 'Speaking', 'Notes', 'Other'),
    minutes: (v): v is number => number(v) && v >= 0, done: bool }),
  questionBank: shape<QuestionBankSet>({ id, title: text, skill: practiceSkill, status: oneOf('Published', 'Draft', 'Archived', 'unknown'),
    source: optional(text), questionCount: optional(number), durationMinutes: optional(number), sections: optional(sections), ...timestamps }),
  submissions: shape<Submission>({ id, studentId: id, title: text, skill, createdAt: number,
    status: oneOf('queued', 'accepted', 'in_review', 'posted', 'graded', 'draft', 'published', 'hidden', 'deleted', 'unknown'),
    visibility: optional(visibility), content: optional(text), durationSeconds: optional(number), relatedForumPostId: optional(id), taskId: optional(id), updatedAt: optional(number) }),
  forumPosts: shape<ForumPost>({ id, authorId: id, title: text, body: text, tags: strings, visibility,
    status: oneOf('published', 'hidden', 'deleted', 'draft'), skill: optional(skill), authorName: optional(text),
    topicId: optional(id), topicKey: optional(text), submissionId: optional(id), reactionCount: optional(number), commentCount: optional(number), shareCount: optional(number), ...timestamps }),
  practiceHistory: shape<LearningHistory>({ id, userId: id, skill: practiceSkill, title: text, timestamp: number,
    durationSeconds: optional(number), score: optional(number), ...timestamps }),
  grading: shape<GradingRecord>({ id, submissionId: id, teacherId: id, bandScore: (v): v is number => number(v) && v >= 0 && v <= 9,
    feedback: text, rubricScores: optional(rubricScores), createdAt: number, updatedAt: number }),
  applications: shape<VolunteerApplication>({ id, first: text, last: text, email: text, qualification: text,
    status: oneOf('pending', 'approved', 'rejected', 'unknown'), submittedAt: number, decisionReason: optional(text),
    decidedBy: optional(nullable(id)), decidedAt: optional(nullable(number)), evidence: optional(text), createdAt: optional(number), updatedAt: optional(number) }),
  attempts: shape<ExamSession>({ id, userId: id, questionSetId: id, skill: practiceSkill,
    status: oneOf('in_progress', 'submitted', 'completed', 'abandoned'), stage: oneOf('Reading', 'Listening', 'Writing', 'Speaking', 'Completed'),
    startedAt: number, submittedAt: optional(number), remainingSeconds: optional(number), flaggedQuestionIds: strings,
    answers: array(answer), result: optional(result), ...timestamps }),
  notifications: shape<AppNotification>({ id, recipientId: id, content: text, createdAt: number, readBy: strings,
    relatedRoute: optional(text), relatedEntityId: optional(text), updatedAt: optional(number) }),
  registrations: shape<Registration>({ id, first: text, last: text, email: text,
    status: oneOf('pending_verification', 'verified', 'rejected', 'unknown'), createdAt: number, updatedAt: optional(number) }),
  forumTopics: shape<ForumTopic>({ id, key: text, title: text, description: optional(text), ...timestamps }),
  forumComments: shape<ForumComment>({ id, postId: id, authorId: id, body: text, parentId: optional(nullable(id)), hidden: optional(bool), ...timestamps }),
  forumReports: shape<ForumReport>({ id, postId: id, reporterId: id, reason: text, detail: text,
    status: oneOf('open', 'resolved', 'dismissed'), ...timestamps }),
  review: shape<MigrationReview>({ path: text, reason: oneOf('owner-unresolved', 'invalid-record', 'invalid-collection', 'duplicate-id', 'invalid-group-key',
    'invalid-nested-data', 'broken-reference', 'invalid-state', 'duplicate-answer', 'unrecognized-field'),
    original: (_v): _v is unknown => true, detail: optional(text) }),
};
export const nestedFields: Record<string, Record<string, Guard<unknown>>> = {
  users: { profile: optional(profile) }, questionBank: { sections: optional(sections) }, notes: { reference: optional(reference) },
  grading: { rubricScores: optional(rubricScores) }, attempts: { answers: array(answer), result: optional(result), flaggedQuestionIds: strings },
};
// ISO calendar day keys match the existing v10 plan and seed date contract.
export function isStudyDay(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(`${key}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key;
}
