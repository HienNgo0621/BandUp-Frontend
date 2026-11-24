import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextValue, AuthResult } from '../types/auth';
import type { User } from '../types/user';
import { authService } from '../services/auth/authService';

export const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.restoreSession()?.user ?? null);
  const login = useCallback(async (identifier: string, password: string): Promise<AuthResult> => {
    const result = await authService.login(identifier, password);
    if (result.ok) setUser(result.user);
    return result;
  }, []);
  const logout = useCallback(() => { authService.logout(); setUser(null); }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, role: user?.role ?? 'guest', isAuthenticated: Boolean(user), login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
