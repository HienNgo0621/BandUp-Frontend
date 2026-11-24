import type { AppRole } from './common';
import type { User } from './user';

export interface AuthSession { userId: string; role: AppRole; issuedAt: number }
export type AuthResult = { ok: true; user: User; session: AuthSession } | { ok: false; reason: 'not-found' | 'invalid-credentials' | 'blocked' | 'pending' | 'unavailable' };
export interface AuthContextValue {
  user: User | null;
  role: AppRole | 'guest';
  isAuthenticated: boolean;
  login: (userIdOrEmail: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  /** @deprecated Kept optional solely for older test and integration fixtures. */
  switchDemoAccount?: (userId: string) => Promise<AuthResult>;
}
