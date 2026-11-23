import type { BaseEntity } from './common';
export type VerificationStatus = 'pending_verification' | 'verified' | 'rejected' | 'unknown';
export interface Registration extends BaseEntity { id: string; first: string; last: string; email: string; status: VerificationStatus; createdAt: number }
