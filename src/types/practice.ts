import type { BaseEntity, Skill } from './common';
export type PracticeSkill = Skill | 'Mock Test';
export type QuestionType = 'Multiple Choice' | 'True / False / Not Given' | 'Yes / No / Not Given' | 'Form Completion' | 'Note Completion' | 'Sentence Completion' | 'Matching Information' | 'Matching Headings' | 'Short Answer' | 'Other';
export interface PracticeTask extends BaseEntity { id: string; title: string; skill: PracticeSkill; source?: string; questionCount?: number; durationMinutes?: number; status?: string; metadata?: Record<string, string | number | boolean | null> }
export interface PracticeQuestionSet { id: string; title: string; skill: PracticeSkill; sections: PracticeSection[] }
export interface PracticeSection { id: string; title: string; instructions?: string; content?: string; groups: QuestionGroup[] }
export interface QuestionGroup { id: string; type: QuestionType; startQuestionNumber: number; questions: PracticeQuestion[] }
export interface PracticeQuestion { id: string; number: number; prompt: string; options?: string[]; answerKey?: string | string[]; acceptedAnswers?: string[]; explanation?: string }
