import type { AuthResult, AuthSession } from '../../types/auth';
import type { AppRole } from '../../types/common';
import type { User } from '../../types/user';
import { demoUsers } from '../demo/seedData';
import { localStorageService, isRecord } from '../storage/localStorageService';
import { sessionStorageService } from '../storage/sessionStorageService';
import { STORAGE_KEYS } from '../storage/storageKeys';

interface StoredAppData { users: User[]; [key: string]: unknown }
function isUser(value: unknown): value is User {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    ['student', 'teacher', 'admin'].includes(String(value.role)) && typeof value.status === 'string';
}
function isStoredAppData(value: unknown): value is StoredAppData {
  return isRecord(value) && Array.isArray(value.users) && value.users.every(isUser);
}
function users(): User[] {
  const storedUsers = localStorageService.read(STORAGE_KEYS.appData, isStoredAppData)?.users ?? [];
  const known = new Set(storedUsers.map((user) => user.id));
  return [...storedUsers, ...demoUsers.filter((user) => !known.has(user.id))];
}
function sessionFor(user: User): AuthSession { return { userId: user.id, role: user.role, issuedAt: Date.now() }; }

export const authService = {
  getUsers(): User[] { return users(); },
  findUser(userIdOrEmail: string): User | null {
    const value = userIdOrEmail.trim().toLowerCase();
    return users().find((user) => user.id.toLowerCase() === value || user.email?.toLowerCase() === value) ?? null;
  },
  login(userIdOrEmail: string): AuthResult {
    const user = this.findUser(userIdOrEmail);
    if (!user) return { ok: false, reason: 'not-found' };
    if (user.status === 'blocked') return { ok: false, reason: 'blocked' };
    const session = sessionFor(user);
    if (!sessionStorageService.writeAuthSession(session)) return { ok: false, reason: 'unavailable' };
    return { ok: true, user, session };
  },
  restoreSession(): { user: User; session: AuthSession } | null {
    const session = sessionStorageService.readAuthSession();
    if (session) {
      const user = users().find((item) => item.id === session.userId);
      if (!user || user.status === 'blocked' || user.role !== session.role) { sessionStorageService.clearAuthSession(); return null; }
      return { user, session };
    }
    // Continue sessions created by the v10 demo without changing or deleting legacy data.
    const legacyId = sessionStorageService.readLegacyValue('ep_uid');
    const user = legacyId ? users().find((item) => item.id === legacyId) : null;
    if (!user || user.status === 'blocked') return null;
    const migrated = sessionFor(user);
    sessionStorageService.writeAuthSession(migrated);
    return { user, session: migrated };
  },
  logout(): void { sessionStorageService.clearAuthSession(); },
  canAccessRole(userRole: AppRole | 'guest', allowedRoles: readonly AppRole[]): boolean {
    return userRole !== 'guest' && allowedRoles.includes(userRole);
  },
};

export function canReadForumVisibility(role: AppRole | 'guest', viewerId: string | null, authorId: string, visibility: 'PUBLIC' | 'TEACHER_ONLY' | 'ONLY_ME'): boolean {
  if (visibility === 'PUBLIC') return true;
  if (visibility === 'ONLY_ME') return viewerId === authorId;
  return viewerId === authorId || role === 'teacher';
}
