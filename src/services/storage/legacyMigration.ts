import { STORAGE_KEYS, LEGACY_LOCAL_STORAGE_KEYS } from './storageKeys';
import { isRecord, isRecordArray, localStorageService } from './localStorageService';
import { createEmptyAppData } from '../demo/seedData';
import type { User } from '../../types/user';
import type { AccountStatus, AppRole, JsonValue, Skill } from '../../types/common';
import type { QuestionBankSet } from '../../types/question-bank';
import type { Registration } from '../../types/registration';
import type { VolunteerApplication } from '../../types/application';
import type { AppNotification } from '../../types/notification';
import type { ForumComment, ForumPost, ForumReport, ForumTopic } from '../../types/forum';
import type { GradingRecord } from '../../types/grading';
import type { StudyPlan, StudyTask, LearningHistory, LearningNote } from '../../types/learning';
import type { Submission } from '../../types/submission';

export interface AppDataSnapshot {
  schemaVersion: number;
  users: User[];
  questionBank: QuestionBankSet[];
  notifications: AppNotification[];
  legacy: Record<string, unknown>;
  migratedAt: number | null;
  registrations: Registration[];
  applications: VolunteerApplication[];
  submissions: Submission[];
  grading: GradingRecord[];
  forumTopics: ForumTopic[];
  forumPosts: ForumPost[];
  forumComments: ForumComment[];
  forumReports: ForumReport[];
  practiceHistory: LearningHistory[];
  studyPlan: StudyPlan;
  notes: LearningNote[];
  preferences: Record<string, JsonValue>;
  supportMessages: JsonValue[];
}
export interface MigrationResult { status: 'already-current' | 'migrated' | 'no-legacy-data' | 'invalid-data' | 'storage-unavailable'; foundKeys: string[]; invalidKeys: string[]; snapshot: AppDataSnapshot | null }

function parseLegacy(raw: string): unknown { return JSON.parse(raw) as unknown; }
function validUsers(value: unknown): value is Record<string, unknown>[] {
  return isRecordArray(value) && value.every((u) => typeof u.id === 'string' && typeof u.name === 'string' && ['student', 'teacher', 'admin'].includes(String(u.role)));
}
function mapUsers(value: Record<string, unknown>[]): User[] {
  return value.map((item) => {
    const role = item.role as AppRole;
    const rawStatus = String(item.st ?? item.status ?? 'unknown');
    const status: AccountStatus = ['active', 'blocked', 'muted', 'pending'].includes(rawStatus) ? rawStatus as AccountStatus : 'unknown';
    const profile: User['profile'] = { shortName: typeof item.short === 'string' ? item.short : undefined, label: typeof item.label === 'string' ? item.label : undefined, joinedAt: typeof item.joined === 'number' ? item.joined : undefined };
    for (const [key, val] of Object.entries(item)) if (!['id', 'name', 'email', 'role', 'st', 'status', 'short', 'label', 'joined'].includes(key)) {
      if (val === null || ['string', 'number', 'boolean'].includes(typeof val) || Array.isArray(val) || isRecord(val)) profile[key] = val as JsonValue;
    }
    return { id: String(item.id), name: String(item.name), email: typeof item.email === 'string' ? item.email : undefined, role, status, label: typeof item.label === 'string' ? item.label : role, profile };
  });
}
function isSnapshot(value: unknown): value is AppDataSnapshot {
  return isRecord(value) && value.schemaVersion === 1 && Array.isArray(value.users) && Array.isArray(value.questionBank) && Array.isArray(value.notifications) && isRecord(value.legacy) &&
    Array.isArray(value.registrations) && Array.isArray(value.applications) && Array.isArray(value.submissions) && Array.isArray(value.grading) &&
    Array.isArray(value.forumTopics) && Array.isArray(value.forumPosts) && Array.isArray(value.forumComments) && Array.isArray(value.forumReports) &&
    Array.isArray(value.practiceHistory) && isRecord(value.studyPlan) && Array.isArray(value.notes) && isRecord(value.preferences) && Array.isArray(value.supportMessages);
}
function mapQuestionBank(value: unknown): QuestionBankSet[] | null {
  if (!isRecordArray(value)) return null;
  const mapped: QuestionBankSet[] = [];
  for (const item of value) {
    const skill = ['Listening', 'Reading', 'Writing', 'Speaking', 'Mock Test'].includes(String(item.skill)) ? item.skill as QuestionBankSet['skill'] : null;
    if (typeof item.id !== 'string' || typeof item.title !== 'string' || !skill) return null;
    mapped.push({ id: item.id, title: item.title, skill, source: typeof item.src === 'string' ? item.src : typeof item.source === 'string' ? item.source : undefined,
      questionCount: typeof item.q === 'number' ? item.q : typeof item.questionCount === 'number' ? item.questionCount : undefined,
      durationMinutes: typeof item.mins === 'number' ? item.mins : typeof item.durationMinutes === 'number' ? item.durationMinutes : undefined,
      status: ['Published', 'Draft', 'Archived'].includes(String(item.st ?? item.status)) ? (item.st ?? item.status) as QuestionBankSet['status'] : 'unknown', updatedAt: typeof item.upd === 'number' ? item.upd : undefined });
  }
  return mapped;
}
function legacyRows(value: unknown, key: string): Record<string, unknown>[] {
  if (!isRecord(value)) return [];
  return isRecordArray(value[key]) ? value[key] : [];
}
function mapRegistrations(value: unknown): Registration[] {
  return legacyRows(value, 'registrations').flatMap((item) => typeof item.id === 'string' && typeof item.first === 'string' && typeof item.last === 'string' && typeof item.email === 'string'
    ? [{ id: item.id, first: item.first, last: item.last, email: item.email, createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0, status: ['pending_verification', 'verified', 'rejected'].includes(String(item.status)) ? item.status as Registration['status'] : 'unknown' }]
    : []);
}
function mapApplications(value: unknown): VolunteerApplication[] {
  return legacyRows(value, 'applications').flatMap((item) => typeof item.id === 'string' && typeof item.first === 'string' && typeof item.last === 'string' && typeof item.email === 'string'
    ? [{ id: item.id, first: item.first, last: item.last, email: item.email, qualification: typeof item.qualification === 'string' ? item.qualification : '', submittedAt: typeof item.submittedAt === 'number' ? item.submittedAt : 0,
      status: ['pending', 'approved', 'rejected'].includes(String(item.status)) ? item.status as VolunteerApplication['status'] : 'unknown', decisionReason: typeof item.decisionReason === 'string' ? item.decisionReason : undefined,
      decidedBy: typeof item.decidedBy === 'string' || item.decidedBy === null ? item.decidedBy : undefined, decidedAt: typeof item.decidedAt === 'number' || item.decidedAt === null ? item.decidedAt : undefined, evidence: typeof item.evidence === 'string' ? item.evidence : undefined }]
    : []);
}
function mapNotifications(value: unknown): AppNotification[] {
  return legacyRows(value, 'nf').flatMap((item) => {
    if (typeof item.id !== 'string' || typeof item.to !== 'string' || typeof item.text !== 'string') return [];
    const readState = isRecord(item.r) ? item.r : {};
    return [{ id: item.id, recipientId: item.to, content: item.text, createdAt: typeof item.ts === 'number' ? item.ts : 0,
      readBy: Object.entries(readState).filter(([, read]) => Boolean(read)).map(([userId]) => userId), relatedRoute: typeof item.pg === 'string' ? item.pg : undefined,
      relatedEntityId: typeof item.arg === 'string' ? item.arg : undefined }];
  });
}
function asSkill(value: unknown): Skill | null { return ['Listening', 'Reading', 'Writing', 'Speaking'].includes(String(value)) ? value as Skill : null; }
function mapSubmissions(value: unknown): Submission[] {
  return legacyRows(value, 'subs').flatMap((item) => {
    const skill = asSkill(item.type);
    if (typeof item.id !== 'string' || typeof item.uid !== 'string' || typeof item.title !== 'string' || !skill) return [];
    const visibility = ['PUBLIC', 'TEACHER_ONLY', 'ONLY_ME'].includes(String(item.visibility)) ? item.visibility as Submission['visibility'] : undefined;
    const rawStatus = String(item.st);
    const status: Submission['status'] = ['queued', 'accepted', 'in_review', 'posted', 'graded', 'draft', 'published', 'hidden', 'deleted'].includes(rawStatus) ? rawStatus as Submission['status'] : 'unknown';
    return [{ id: item.id, studentId: item.uid, skill, title: item.title, content: typeof item.text === 'string' ? item.text : undefined, durationSeconds: typeof item.dur === 'number' ? item.dur : undefined,
      visibility, status, relatedForumPostId: typeof item.forumPostId === 'string' ? item.forumPostId : undefined, taskId: typeof item.tid === 'string' ? item.tid : undefined,
      createdAt: typeof item.ts === 'number' ? item.ts : 0, updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : undefined }];
  });
}
function mapGrading(value: unknown): GradingRecord[] {
  return legacyRows(value, 'fb').flatMap((item) => typeof item.id === 'string' && typeof item.sid === 'string' && typeof item.vid === 'string' && typeof item.band === 'number'
    ? [{ id: item.id, submissionId: item.sid, teacherId: item.vid, bandScore: item.band, feedback: typeof item.comment === 'string' ? item.comment : '', rubricScores: Array.isArray(item.rub) && item.rub.every((score) => typeof score === 'number') ? item.rub : undefined, createdAt: typeof item.ts === 'number' ? item.ts : 0, updatedAt: typeof item.ts === 'number' ? item.ts : 0 }]
    : []);
}
function mapForumPosts(value: unknown): ForumPost[] {
  return legacyRows(value, 'forumPosts').flatMap((item) => {
    const visibility = ['PUBLIC', 'TEACHER_ONLY', 'ONLY_ME'].includes(String(item.visibility)) ? item.visibility as ForumPost['visibility'] : null;
    if (typeof item.id !== 'string' || typeof item.uid !== 'string' || typeof item.title !== 'string' || typeof item.body !== 'string' || !visibility) return [];
    const status = ['published', 'hidden', 'deleted', 'draft'].includes(String(item.status)) ? item.status as ForumPost['status'] : 'draft';
    const skill = asSkill(item.skill);
    const tags = Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : typeof item.tag === 'string' ? [item.tag] : [];
    return [{ id: item.id, authorId: item.uid, authorName: typeof item.author === 'string' ? item.author : undefined, title: item.title, body: item.body, skill: skill ?? undefined,
      topicKey: typeof item.topicKey === 'string' ? item.topicKey : tags[0], tags, visibility, status, submissionId: typeof item.submissionId === 'string' ? item.submissionId : undefined,
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0, updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : undefined }];
  });
}
function mapForumComments(value: unknown): ForumComment[] {
  return legacyRows(value, 'forumComments').flatMap((item) => typeof item.id === 'string' && typeof item.postId === 'string' && typeof item.uid === 'string' && typeof item.body === 'string'
    ? [{ id: item.id, postId: item.postId, authorId: item.uid, body: item.body, parentId: typeof item.parentId === 'string' ? item.parentId : null, hidden: item.hidden === true, createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0 }]
    : []);
}
function mapForumReports(value: unknown): ForumReport[] {
  return legacyRows(value, 'forumReports').flatMap((item) => typeof item.id === 'string' && typeof item.postId === 'string' && typeof item.reporter === 'string' && typeof item.reason === 'string' && typeof item.detail === 'string'
    ? [{ id: item.id, postId: item.postId, reporterId: item.reporter, reason: item.reason, detail: item.detail, status: item.status === 'resolved' || item.status === 'dismissed' ? item.status : 'open', createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0 }]
    : []);
}
function mapTopics(value: unknown): ForumTopic[] {
  if (!isRecord(value)) return [];
  const titles = new Map<string, string>();
  if (isRecord(value.forumTopicLabels)) Object.entries(value.forumTopicLabels).forEach(([key, title]) => { if (typeof title === 'string') titles.set(key, title); });
  legacyRows(value, 'forumPosts').forEach((post) => {
    const key = typeof post.topicKey === 'string' ? post.topicKey : typeof post.tag === 'string' ? post.tag : null;
    if (key && !titles.has(key) && typeof post.title === 'string') titles.set(key, post.title);
  });
  return [...titles].map(([key, title]) => ({ id: key, key, title }));
}
function mapPracticeHistory(value: unknown): LearningHistory[] {
  return legacyRows(value, 'pr').flatMap((item) => {
    const skill = item.skill === 'Mock Test' ? 'Mock Test' : asSkill(item.skill);
    return typeof item.id === 'string' && typeof item.uid === 'string' && typeof item.title === 'string' && skill
      ? [{ id: item.id, userId: item.uid, skill, title: item.title, timestamp: typeof item.ts === 'number' ? item.ts : 0, durationSeconds: typeof item.dur === 'number' ? item.dur : undefined, score: typeof item.ok === 'number' ? item.ok : undefined }]
      : [];
  });
}
function mapStudyPlan(value: unknown): StudyPlan {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([day, rows]) => [day, Array.isArray(rows) ? rows.flatMap((entry) => {
    if (!isRecord(entry) || (typeof entry.id !== 'number' && typeof entry.id !== 'string') || typeof entry.title !== 'string') return [];
    const validSkill = ['Listening', 'Reading', 'Writing', 'Speaking', 'Notes', 'Other'].includes(String(entry.skill)) ? entry.skill as StudyTask['skill'] : 'Other';
    return [{ id: entry.id, title: entry.title, skill: validSkill, minutes: typeof entry.min === 'number' ? entry.min : 0, done: entry.done === true }];
  }) : []]));
}
function mapNotes(value: unknown): LearningNote[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry) || (typeof entry.id !== 'number' && typeof entry.id !== 'string') || typeof entry.h !== 'string') return [];
    const type = ['Vocabulary', 'Grammar', 'Mistake'].includes(String(entry.t)) ? entry.t as LearningNote['type'] : 'Other';
    const ref = isRecord(entry.ref) && typeof entry.ref.kind === 'string' && typeof entry.ref.title === 'string'
      ? { kind: entry.ref.kind, token: typeof entry.ref.tok === 'string' ? entry.ref.tok : undefined, title: entry.ref.title, question: typeof entry.ref.q === 'number' ? entry.ref.q : undefined } : undefined;
    return [{ id: entry.id, type, heading: entry.h, meaning: typeof entry.m === 'string' ? entry.m : '', example: typeof entry.x === 'string' ? entry.x : undefined,
      source: typeof entry.src === 'string' ? entry.src : undefined, dateLabel: typeof entry.d === 'string' ? entry.d : undefined, reference: ref }];
  });
}

export function migrateLegacyData(): MigrationResult {
  const current = localStorageService.read(STORAGE_KEYS.appData, isSnapshot);
  if (current) {
    const sourceKeys = Object.keys(current.legacy);
    const migrationRecordExists = localStorageService.read(STORAGE_KEYS.migration, (value): value is { version: number } => isRecord(value) && value.version === 1);
    const markerSaved = migrationRecordExists || localStorageService.write(STORAGE_KEYS.migration, { version: 1, migratedAt: current.migratedAt, sourceKeys, invalidKeys: [] });
    return { status: markerSaved ? 'already-current' : 'storage-unavailable', foundKeys: sourceKeys, invalidKeys: [], snapshot: current };
  }
  const rawByKey: Record<string, string> = {};
  const invalidKeys: string[] = [];
  for (const key of LEGACY_LOCAL_STORAGE_KEYS) {
    const raw = localStorageService.readRaw(key);
    if (raw !== null) rawByKey[key] = raw;
  }
  const foundKeys = Object.keys(rawByKey);
  if (!foundKeys.length) return { status: 'no-legacy-data', foundKeys, invalidKeys, snapshot: null };

  const parsed: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(rawByKey)) {
    try { parsed[key] = parseLegacy(raw); } catch { invalidKeys.push(key); }
  }
  if (parsed.ep_db_v3 !== undefined && !isRecord(parsed.ep_db_v3)) invalidKeys.push('ep_db_v3');
  if (parsed.ep_plan_v4 !== undefined && !isRecord(parsed.ep_plan_v4)) invalidKeys.push('ep_plan_v4');
  if (parsed.ep_notes_v4 !== undefined && !Array.isArray(parsed.ep_notes_v4)) invalidKeys.push('ep_notes_v4');
  if (parsed.ep_users_v4 !== undefined && !validUsers(parsed.ep_users_v4)) invalidKeys.push('ep_users_v4');
  const migratedQuestionBank = parsed.ep_qb_v4 === undefined ? null : mapQuestionBank(parsed.ep_qb_v4);
  if (parsed.ep_qb_v4 !== undefined && !migratedQuestionBank) invalidKeys.push('ep_qb_v4');
  if (parsed.ep_prefs_v1 !== undefined && !isRecord(parsed.ep_prefs_v1)) invalidKeys.push('ep_prefs_v1');
  if (parsed.ep_support_v1 !== undefined && !Array.isArray(parsed.ep_support_v1)) invalidKeys.push('ep_support_v1');

  const defaults = createEmptyAppData();
  const snapshot: AppDataSnapshot = {
    schemaVersion: 1,
    users: validUsers(parsed.ep_users_v4) ? mapUsers(parsed.ep_users_v4) : defaults.users,
    questionBank: migratedQuestionBank ?? defaults.questionBank,
    notifications: mapNotifications(parsed.ep_db_v3),
    legacy: Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined)),
    migratedAt: Date.now(),
    registrations: mapRegistrations(parsed.ep_db_v3),
    applications: mapApplications(parsed.ep_db_v3),
    submissions: mapSubmissions(parsed.ep_db_v3),
    grading: mapGrading(parsed.ep_db_v3),
    forumTopics: mapTopics(parsed.ep_db_v3),
    forumPosts: mapForumPosts(parsed.ep_db_v3),
    forumComments: mapForumComments(parsed.ep_db_v3),
    forumReports: mapForumReports(parsed.ep_db_v3),
    practiceHistory: mapPracticeHistory(parsed.ep_db_v3),
    studyPlan: mapStudyPlan(parsed.ep_plan_v4),
    notes: mapNotes(parsed.ep_notes_v4),
    preferences: isRecord(parsed.ep_prefs_v1) ? parsed.ep_prefs_v1 as Record<string, JsonValue> : {},
    supportMessages: Array.isArray(parsed.ep_support_v1) ? parsed.ep_support_v1 as JsonValue[] : [],
  };
  if (!localStorageService.write(STORAGE_KEYS.appData, snapshot)) return { status: 'storage-unavailable', foundKeys, invalidKeys, snapshot: null };
  const saved = localStorageService.read(STORAGE_KEYS.appData, isSnapshot);
  if (!saved) return { status: 'storage-unavailable', foundKeys, invalidKeys, snapshot: null };
  if (!localStorageService.write(STORAGE_KEYS.migration, { version: 1, migratedAt: snapshot.migratedAt, sourceKeys: foundKeys, invalidKeys })) {
    return { status: 'storage-unavailable', foundKeys, invalidKeys, snapshot: saved };
  }
  return { status: invalidKeys.length ? 'invalid-data' : 'migrated', foundKeys, invalidKeys, snapshot: saved };
}
