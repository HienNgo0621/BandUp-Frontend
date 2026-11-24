import { beforeEach, describe, expect, it } from 'vitest';
import { authService, canReadForumVisibility } from '../authService';
import { hashPassword } from '../passwordService';
import { STORAGE_KEYS } from '../../storage/storageKeys';
import { createEmptyAppData } from '../../demo/seedData';

describe('authentication and access policy', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  async function createActiveUser(status: 'active' | 'blocked' = 'active') {
    const data = createEmptyAppData();
    data.users = [{ id: 'learner-1', name: 'Learner', email: 'learner@example.com', role: 'student', status, label: 'Learner', profile: { passwordHash: await hashPassword('Password1') } }];
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(data));
  }

  it('authenticates a registered user with the correct password', async () => {
    await createActiveUser();
    const result = await authService.login('learner@example.com', 'Password1');
    expect(result.ok).toBe(true);
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).not.toBeNull();
  });
  it('rejects an incorrect password', async () => {
    await createActiveUser();
    await expect(authService.login('learner@example.com', 'wrong')).resolves.toMatchObject({ ok: false, reason: 'invalid-credentials' });
  });
  it('rejects a blocked user without changing the session', async () => {
    await createActiveUser('blocked');
    await expect(authService.login('learner@example.com', 'Password1')).resolves.toMatchObject({ ok: false, reason: 'blocked' });
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });
  it('restores a session after reload and clears it on logout', async () => {
    await createActiveUser(); await authService.login('learner@example.com', 'Password1');
    expect(authService.restoreSession()?.user.role).toBe('student'); authService.logout(); expect(authService.restoreSession()).toBeNull();
  });
  it('keeps private forum access restricted', () => {
    expect(canReadForumVisibility('admin', 'admin-id', 'student-id', 'ONLY_ME')).toBe(false);
    expect(canReadForumVisibility('teacher', 'teacher-id', 'student-id', 'TEACHER_ONLY')).toBe(true);
    expect(canReadForumVisibility('guest', null, 'student-id', 'PUBLIC')).toBe(true);
  });
});
