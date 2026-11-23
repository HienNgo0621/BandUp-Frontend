import type { AppRole } from './common';
import type { User } from './user';

export interface AuthSession { userId: string; role: AppRole; issuedAt: number }
export type AuthResult = { ok: true; user: User; session: AuthSession } | { ok: false; reason: 'not-found' | 'blocked' | 'unavailable' };
export interface AuthContextValue {
  user: User | null;
  role: AppRole | 'guest';
  isAuthenticated: boolean;
  login: (userIdOrEmail: string) => Promise<AuthResult>;
  logout: () => void;
  switchDemoAccount: (userId: string) => Promise<AuthResult>;
}
