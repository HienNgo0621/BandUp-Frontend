import type { UserRole } from '../../types/common';
import type { ForumPost } from '../../types/forum';

export function canReadForumVisibility(role: UserRole, viewerId: string | null, authorId: string, visibility: unknown): boolean {
  if (typeof visibility !== 'string' || !['PUBLIC', 'TEACHER_ONLY', 'ONLY_ME'].includes(visibility)) return false;
  if (visibility === 'PUBLIC') return true;
  const authenticated = role !== 'guest' && Boolean(viewerId);
  if (!authenticated) return false;
  if (viewerId === authorId) return true;
  return visibility === 'TEACHER_ONLY' && role === 'teacher';
}

// All list, topic, detail and workspace paths share both state and visibility.
// Admin moderation metadata must not expose non-owner private bodies/previews.
export function canReadForumPost(role: UserRole, viewerId: string | null, post: ForumPost, mode: 'published' | 'moderation' = 'published'): boolean {
  const permittedState = post.status === 'published' || (mode === 'moderation' && role === 'admin' &&
    ['hidden', 'draft', 'deleted'].includes(post.status));
  return permittedState && canReadForumVisibility(role, viewerId, post.authorId, post.visibility);
}
