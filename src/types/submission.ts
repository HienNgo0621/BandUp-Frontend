import type { BaseEntity, Skill } from './common';
export type SubmissionVisibility = 'PUBLIC' | 'TEACHER_ONLY' | 'ONLY_ME';
export type SubmissionStatus = 'queued' | 'accepted' | 'in_review' | 'posted' | 'graded' | 'draft' | 'published' | 'hidden' | 'deleted' | 'unknown';
export interface Submission extends BaseEntity { id: string; studentId: string; skill: Skill; title: string; content?: string; durationSeconds?: number; visibility?: SubmissionVisibility; status: SubmissionStatus; relatedForumPostId?: string; taskId?: string; createdAt: number; updatedAt?: number }
