import type { AuthSession } from '../../types/auth';
import { isRecord } from './localStorageService';

function storage(): Storage | null { try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; } }
function isAuthSession(value: unknown): value is AuthSession {
  return isRecord(value) && typeof value.userId === 'string' &&
    ['student', 'teacher', 'admin'].includes(String(value.role)) && typeof value.issuedAt === 'number';
}

export const sessionStorageService = {
  readAuthSession(): AuthSession | null {
    try { const raw = storage()?.getItem('bandup_auth_session_v1'); if (!raw) return null; const value: unknown = JSON.parse(raw); return isAuthSession(value) ? value : null; } catch { return null; }
  },
  writeAuthSession(session: AuthSession): boolean {
    try { const target = storage(); if (!target) return false; target.setItem('bandup_auth_session_v1', JSON.stringify(session)); return true; } catch { return false; }
  },
  clearAuthSession(): void {
    try { const target = storage(); target?.removeItem('bandup_auth_session_v1'); target?.removeItem('ep_uid'); } catch { /* Storage may be disabled. */ }
  },
  readLegacyValue(key: string): string | null {
    try { return storage()?.getItem(key) ?? null; } catch { return null; }
  },
};
