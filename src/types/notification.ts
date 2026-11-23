import type { BaseEntity } from './common';
export interface AppNotification extends BaseEntity { id: string; recipientId: string; content: string; createdAt: number; readBy: string[]; relatedRoute?: string; relatedEntityId?: string }
