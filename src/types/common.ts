export type AppRole = 'student' | 'teacher' | 'admin';

export type Skill = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

export type ThemeMode = 'light' | 'dark' | 'system';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BaseEntity {
  id: string;
  createdAt?: number;
  updatedAt?: number;
}
