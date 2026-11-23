import type { BaseEntity, Skill } from './common';
import type { SubmissionVisibility } from './submission';
export type ForumVisibility = SubmissionVisibility;
export type ForumPostStatus = 'published' | 'hidden' | 'deleted' | 'draft';
export interface ForumTopic extends BaseEntity { id: string; key: string; title: string; description?: string }
export interface ForumPost extends BaseEntity { id: string; authorId: string; authorName?: string; title: string; body: string; skill?: Skill; topicId?: string; topicKey?: string; tags: string[]; visibility: ForumVisibility; status: ForumPostStatus; submissionId?: string; reactionCount?: number; commentCount?: number; shareCount?: number }
export interface ForumComment extends BaseEntity { id: string; postId: string; authorId: string; body: string; parentId?: string | null; hidden?: boolean }
export interface ForumReaction { id: string; postId: string; userId: string; kind: string; createdAt: number }
export interface ForumReport extends BaseEntity { id: string; postId: string; reporterId: string; reason: string; detail: string; status: 'open' | 'resolved' | 'dismissed' }
export interface ForumShare { postId: string; count: number; lastSharedAt?: number }
