import { beforeEach, describe, expect, it } from 'vitest';
import { authService, canReadForumVisibility } from '../authService';
import { STORAGE_KEYS } from '../../storage/storageKeys';
import { createEmptyAppData } from '../../demo/seedData';

describe('demo authentication and access policy', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it.each(['s1', 'v1', 'a1'])('allows the demo account %s', (id) => {
    const result = authService.login(id);
    expect(result.ok).toBe(true);
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).not.toBeNull();
  });

  it('rejects blocked users without replacing a valid session', () => {
    expect(authService.login('s1').ok).toBe(true);
    const existing = sessionStorage.getItem(STORAGE_KEYS.session);
    expect(authService.login('sx7')).toMatchObject({ ok: false, reason: 'blocked' });
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).toBe(existing);
  });

  it('restores a session after reload and clears it on logout', () => {
    authService.login('v1');
    expect(authService.restoreSession()?.user.role).toBe('teacher');
    authService.logout();
    expect(authService.restoreSession()).toBeNull();
  });

  it('fails closed for private forum content and keeps ONLY_ME owner-only', () => {
    expect(canReadForumVisibility('admin', 'admin-id', 'student-id', 'ONLY_ME')).toBe(false);
    expect(canReadForumVisibility('teacher', 'teacher-id', 'student-id', 'TEACHER_ONLY')).toBe(true);
    expect(canReadForumVisibility('guest', null, 'student-id', 'PUBLIC')).toBe(true);
  });

  it('keeps legacy user status authoritative for authorization', () => {
    const data = createEmptyAppData();
    data.users = data.users.map((user) => user.id === 's1' ? { ...user, status: 'blocked' } : user);
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(data));
    expect(authService.login('s1')).toMatchObject({ ok: false, reason: 'blocked' });
  });
});
