import { describe, expect, it } from 'vitest';
import type { UserRole } from '../../../types/common';
import type { ForumPost } from '../../../types/forum';
import { canReadForumPost, canReadForumVisibility } from '../forumPolicy';

// Expected permissions are explicit fixtures, independent of policy logic.
const matrix: [UserRole, string | null, boolean, boolean, boolean][] = [
  ['guest', null, true, false, false],
  ['guest', 'owner', true, false, false],
  ['student', 'owner', true, true, true],
  ['student', 'other', true, false, false],
  ['teacher', 'owner', true, true, true],
  ['teacher', 'other', true, true, false],
  ['admin', 'owner', true, true, true],
  ['admin', 'other', true, false, false],
  ['teacher', null, true, false, false],
  ['admin', null, true, false, false],
];
describe('Forum permission policy — FR-31/32/68/72, BU-001, NFR-05', () => {
  for (const [role, viewer, publicAccess, teacherAccess, privateAccess] of matrix) {
    it(`${role}/${viewer ?? 'anonymous'} follows the visibility matrix`, () => {
      expect(canReadForumVisibility(role, viewer, 'owner', 'PUBLIC')).toBe(publicAccess);
      expect(canReadForumVisibility(role, viewer, 'owner', 'TEACHER_ONLY')).toBe(teacherAccess);
      expect(canReadForumVisibility(role, viewer, 'owner', 'ONLY_ME')).toBe(privateAccess);
    });
  }
  it.each([undefined, null, '', 'private', 'TEACHER_VOLUNTEER_ONLY', {}, ['PUBLIC']])('fails closed for invalid visibility %j', (value) => {
    expect(canReadForumVisibility('teacher', 'teacher', 'owner', value)).toBe(false);
    expect(canReadForumVisibility('student', 'owner', 'owner', value)).toBe(false);
  });
  const post: ForumPost = { id: 'post', authorId: 'owner', title: 'Post', body: 'Body', tags: [], visibility: 'PUBLIC', status: 'published' };
  it.each(['hidden', 'deleted', 'draft'] as const)('does not publish %s content', (status) => {
    expect(canReadForumPost('student', 'owner', { ...post, status })).toBe(false);
    expect(canReadForumPost('teacher', 'teacher', { ...post, status })).toBe(false);
    expect(canReadForumPost('admin', 'admin', { ...post, status }, 'moderation')).toBe(true);
    expect(canReadForumPost('admin', 'admin', { ...post, status, visibility: 'ONLY_ME' }, 'moderation')).toBe(false);
  });
});
