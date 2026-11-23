import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextValue, AuthResult } from '../types/auth';
import type { User } from '../types/user';
import { authService } from '../services/auth/authService';

export const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.restoreSession()?.user ?? null);
  const login = useCallback(async (identifier: string): Promise<AuthResult> => {
    const result = authService.login(identifier);
    if (result.ok) setUser(result.user);
    return result;
  }, []);
  const logout = useCallback(() => { authService.logout(); setUser(null); }, []);
  const switchDemoAccount = useCallback(async (userId: string) => {
    const result = authService.login(userId);
    if (result.ok) setUser(result.user);
    return result;
  }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, role: user?.role ?? 'guest', isAuthenticated: Boolean(user), login, logout, switchDemoAccount }), [user, login, logout, switchDemoAccount]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
