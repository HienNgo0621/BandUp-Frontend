import type { BaseEntity, Skill } from './common';
import type { PracticeQuestionSet } from './practice';
export type ExamStage = 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Completed';
export type ExamStatus = 'in_progress' | 'submitted' | 'completed' | 'abandoned';
export interface ExamAnswer { questionId: string; value: string | string[]; updatedAt: number }
export interface ExamResult { score?: number; band?: number; correct?: number; incorrect?: number; unanswered?: number; skillScores?: Partial<Record<Skill, number>> }
export interface ExamSession extends BaseEntity { id: string; userId: string; questionSetId: string; skill: Skill | 'Mock Test'; status: ExamStatus; stage: ExamStage; startedAt: number; submittedAt?: number; remainingSeconds?: number; answers: ExamAnswer[]; flaggedQuestionIds: string[]; result?: ExamResult }
export interface ExamDefinition { id: string; title: string; questionSet: PracticeQuestionSet; durationsByStage: Partial<Record<ExamStage, number>> }
