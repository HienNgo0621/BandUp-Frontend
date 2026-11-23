import type { BaseEntity } from './common';
import type { PracticeSkill, QuestionType, PracticeSection, PracticeQuestion } from './practice';
export type QuestionBankStatus = 'Published' | 'Draft' | 'Archived' | 'unknown';
export interface QuestionBankSet extends BaseEntity { id: string; title: string; skill: PracticeSkill; source?: string; status: QuestionBankStatus; questionCount?: number; durationMinutes?: number; sections?: PracticeSection[] }
export interface QuestionBankQuestion extends PracticeQuestion { groupId: string }
export type QuestionBankQuestionType = QuestionType;
