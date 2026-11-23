export type AppRole = 'student' | 'teacher' | 'admin';
export type UserRole = 'guest' | AppRole;
export type AccountStatus = 'active' | 'blocked' | 'muted' | 'pending' | 'unknown';

export type Skill = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

export type ThemeMode = 'light' | 'dark' | 'system';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BaseEntity {
  id: string;
  createdAt?: number;
  updatedAt?: number;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
