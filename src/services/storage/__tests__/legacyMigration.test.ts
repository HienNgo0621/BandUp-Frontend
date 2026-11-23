import { beforeEach, describe, expect, it } from 'vitest';
import { migrateLegacyData } from '../legacyMigration';
import { STORAGE_KEYS } from '../storageKeys';
import { appDataService } from '../../appDataService';
import { authService } from '../../auth/authService';

describe('legacy data migration', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('copies valid v10 payloads, maps supported records and preserves source keys', () => {
    const db = {
      v: 3, seq: 12,
      pr: [{ id: 'p1', uid: 's1', skill: 'Reading', title: 'Reading test', ts: 50, dur: 120, ok: 35 }],
      subs: [{ id: 't1', uid: 's1', type: 'Writing', title: 'Essay', text: 'Sample', ts: 45, st: 'graded', visibility: 'PUBLIC', forumPostId: 'fp1' }],
      fb: [{ id: 'f1', sid: 't1', vid: 'v1', band: 7, comment: 'Clear response', rub: [7, 7, 7, 7], ts: 55 }],
      forumTopicLabels: { writing: 'Writing practice' },
      forumPosts: [{ id: 'fp1', uid: 's1', title: 'Essay', body: 'Sample', topicKey: 'writing', tags: ['writing'], visibility: 'PUBLIC', status: 'published', createdAt: 45 }],
      forumComments: [{ id: 'fc1', postId: 'fp1', uid: 'v1', body: 'Good work', createdAt: 52 }],
      forumReports: [{ id: 'fr1', postId: 'fp1', reporter: 's1', reason: 'Other', detail: 'Concern', status: 'open', createdAt: 53 }],
      nf: [{ id: 'n1', to: 's1', text: 'Feedback is ready', pg: 'feedback', arg: 'f1', ts: 55, r: { s1: 1 } }],
      registrations: [{ id: 'r1', first: 'Mai', last: 'Do', email: 'mai@example.com', status: 'pending_verification', createdAt: 42 }], applications: [],
    };
    localStorage.setItem('ep_db_v3', JSON.stringify(db));
    localStorage.setItem('ep_users_v4', JSON.stringify([{ id: 's1', name: 'Learner', email: 'learner@example.com', role: 'student', st: 'active' }]));
    localStorage.setItem('ep_plan_v4', JSON.stringify({ '2026-11-23': [{ id: 1, done: true }] }));
    localStorage.setItem('ep_notes_v4', JSON.stringify([{ id: 2, h: 'retain' }]));
    localStorage.setItem('ep_qb_v4', JSON.stringify([{ id: 'q1', title: 'Reading', skill: 'Reading', q: 40, mins: 60, st: 'Published' }]));
    localStorage.setItem('ep_plan_v4', JSON.stringify({ '2026-11-23': [{ id: 1, title: 'Read passage', skill: 'Reading', min: 20, done: true }] }));
    localStorage.setItem('ep_notes_v4', JSON.stringify([{ id: 2, t: 'Vocabulary', h: 'mitigate', m: 'make less harmful', ref: { kind: 'Reading', tok: 'p3', title: 'Test', q: 19 } }]));
    localStorage.setItem('ep_prefs_v1', JSON.stringify({ s1: { band: '8.5' } }));
    localStorage.setItem('ep_support_v1', JSON.stringify([{ uid: 's1', subject: 'Help' }]));

    const first = migrateLegacyData();
    expect(first.status).toBe('migrated');
    expect(first.snapshot?.legacy.ep_db_v3).toEqual(db);
    expect(first.snapshot?.users[0]?.id).toBe('s1');
    expect(first.snapshot?.questionBank[0]?.questionCount).toBe(40);
    expect(first.snapshot?.registrations[0]?.id).toBe('r1');
    expect(first.snapshot?.notifications[0]).toMatchObject({ recipientId: 's1', content: 'Feedback is ready', readBy: ['s1'], relatedRoute: 'feedback', relatedEntityId: 'f1' });
    expect(first.snapshot?.submissions[0]).toMatchObject({ studentId: 's1', skill: 'Writing', relatedForumPostId: 'fp1' });
    expect(first.snapshot?.grading[0]).toMatchObject({ submissionId: 't1', teacherId: 'v1', bandScore: 7 });
    expect(first.snapshot?.forumTopics[0]).toMatchObject({ id: 'writing', title: 'Writing practice' });
    expect(first.snapshot?.forumPosts[0]).toMatchObject({ authorId: 's1', tags: ['writing'], visibility: 'PUBLIC' });
    expect(first.snapshot?.forumComments[0]?.authorId).toBe('v1');
    expect(first.snapshot?.forumReports[0]?.reporterId).toBe('s1');
    expect(first.snapshot?.practiceHistory[0]).toMatchObject({ userId: 's1', score: 35 });
    expect(first.snapshot?.studyPlan['2026-11-23']?.[0]?.minutes).toBe(20);
    expect(first.snapshot?.notes[0]).toMatchObject({ heading: 'mitigate', reference: { token: 'p3', question: 19 } });
    expect(first.snapshot?.preferences.s1).toEqual({ band: '8.5' });
    expect(first.snapshot?.supportMessages).toHaveLength(1);
    expect(localStorage.getItem('ep_db_v3')).toBe(JSON.stringify(db));
    expect(migrateLegacyData().status).toBe('already-current');
  });

  it('contains malformed legacy JSON without deleting it or crashing', () => {
    localStorage.setItem('ep_notes_v4', '{invalid');
    const result = migrateLegacyData();
    expect(result.status).toBe('invalid-data');
    expect(result.invalidKeys).toContain('ep_notes_v4');
    expect(localStorage.getItem('ep_notes_v4')).toBe('{invalid');
    expect(localStorage.getItem(STORAGE_KEYS.migration)).not.toBeNull();
  });

  it('does not claim a migration when browser storage cannot verify the saved snapshot', () => {
    expect(migrateLegacyData().status).toBe('no-legacy-data');
  });

  it('persists application updates across reloads and keeps business data on logout', () => {
    const initial = appDataService.load();
    const changed = appDataService.update((current) => ({ ...current, legacy: { ...current.legacy, retainedValue: 'persisted' } }));
    expect(changed?.legacy.retainedValue).toBe('persisted');
    const beforeLogout = localStorage.getItem(STORAGE_KEYS.appData);
    sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId: 's1', role: 'student', issuedAt: 1 }));
    authService.logout();
    expect(appDataService.load().legacy.retainedValue).toBe('persisted');
    expect(localStorage.getItem(STORAGE_KEYS.appData)).toBe(beforeLogout);
    expect(initial.users.length).toBeGreaterThan(0);
  });
});
