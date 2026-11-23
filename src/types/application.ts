import type { BaseEntity } from './common';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'unknown';
export interface VolunteerApplication extends BaseEntity { id: string; first: string; last: string; email: string; qualification: string; status: ApplicationStatus; submittedAt: number; decisionReason?: string; decidedBy?: string | null; decidedAt?: number | null; evidence?: string }
