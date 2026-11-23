import type { BaseEntity, Skill } from './common';
export interface StudyTask { id: string | number; title: string; skill: Skill | 'Notes' | 'Other'; minutes: number; done: boolean }
export type StudyPlan = Record<string, StudyTask[]>;
export interface LearningGoal { id: string; skill?: Skill; targetBand?: number; examDate?: string; title?: string }
export interface LearningProgress { userId: string; skill: Skill; completed: number; score?: number; streak?: number }
export interface LearningHistory extends BaseEntity { id: string; userId: string; skill: Skill | 'Mock Test'; title: string; timestamp: number; durationSeconds?: number; score?: number }
export interface LearningNote { id: string | number; type: 'Vocabulary' | 'Grammar' | 'Mistake' | 'Other'; heading: string; meaning: string; example?: string; source?: string; dateLabel?: string; reference?: { kind: string; token?: string; title: string; question?: number } }
