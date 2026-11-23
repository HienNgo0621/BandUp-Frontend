import type { BaseEntity } from './common';
export interface GradingRecord extends BaseEntity { id: string; submissionId: string; teacherId: string; bandScore: number; feedback: string; rubricScores?: number[]; createdAt: number; updatedAt: number }
