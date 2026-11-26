import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { AppRole } from '../../types/common';
import type { User } from '../../types/user';
import type { AuthContextValue } from '../../types/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { AppDataContext, type AppDataContextValue } from '../../contexts/AppDataContext';
import { ToastProvider } from '../../components/ui/Toast';
import { createEmptyAppData } from '../../services/demo/seedData';
import { ForumPage, ForumPostPage, ForumTopicPage } from '../ForumGuestPages';
import { WorkspacePage } from '../WorkspacePages';

const seed = createEmptyAppData();
const users = seed.users;
const posts = [
  { ...seed.forumPosts[0], id: 'public-post', title: 'Public topic', body: 'Public body' },
  { ...seed.forumPosts[1], id: 'private-post', topicKey: 'writing', title: 'Private topic', body: 'Private body' },
  { ...seed.forumPosts[0], id: 'teacher-post', title: 'Teacher topic', body: 'Teacher body', visibility: 'TEACHER_ONLY' as const },
  { ...seed.forumPosts[0], id: 'hidden-post', title: 'Hidden topic', body: 'Hidden body', status: 'hidden' as const },
];
const data = { ...seed, forumPosts: posts, submissions: [
  { id: 'private-submission', studentId: 's1', title: 'Private submission', visibility: 'ONLY_ME' as const,
    skill: 'Writing' as const, status: 'queued' as const, createdAt: 1 },
  { id: 'shared-submission', studentId: 'sx1', title: 'Shared submission', visibility: 'TEACHER_ONLY' as const,
    skill: 'Speaking' as const, status: 'queued' as const, createdAt: 1 },
] };
const app: AppDataContextValue = { data, users, notifications: data.notifications, questionBank: data.questionBank,
  updateUser: vi.fn(), replaceQuestionBank: vi.fn(), markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn(), refresh: vi.fn() };
function Providers({ user, children }: { user: User | null; children: ReactNode }) {
  const auth: AuthContextValue = { user, role: user?.role ?? 'guest', isAuthenticated: Boolean(user),
    login: async () => ({ ok: false, reason: 'not-found' }), logout: vi.fn() };
  return <AuthContext.Provider value={auth}><AppDataContext.Provider value={app}><ToastProvider>{children}</ToastProvider></AppDataContext.Provider></AuthContext.Provider>;
}
function publicRoute(user: User | null, path: string) {
  return <Providers user={user}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/forum" element={<ForumPage/>}/>
    <Route path="/forum/topic/:topicKey" element={<ForumTopicPage/>}/>
    <Route path="/forum/post/:postId" element={<ForumPostPage/>}/>
  </Routes></MemoryRouter></Providers>;
}
describe('Forum routes enforce shared permissions — BU-001, PG-018/019/020', () => {
  for (const userId of ['v1', 'v2', 'sx1', 'a1']) {
    it.each(['/forum', '/forum/topic/writing', '/forum/post/private-post'])(`${userId} cannot read another student's ONLY_ME via %s`, (path) => {
      render(publicRoute(users.find((user) => user.id === userId)!, path));
      expect(screen.queryByText('Private body')).not.toBeInTheDocument();
      expect(screen.queryByText('Private topic')).not.toBeInTheDocument();
      if (path.includes('/post/')) expect(screen.getByRole('heading', { name: 'Post unavailable' })).toBeInTheDocument();
    });
  }
  it('keeps public topic navigation and post detail functional for a guest', () => {
    render(publicRoute(null, '/forum'));
    expect(screen.getByText('Public body')).toBeInTheDocument();
    expect(screen.queryByText('Teacher body')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden body')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Open topic/ }));
    fireEvent.click(screen.getByRole('link', { name: 'Public topic' }));
    expect(screen.getByRole('heading', { name: 'Public topic' })).toBeInTheDocument();
    expect(screen.getByText('Public body')).toBeInTheDocument();
  });
  it('revokes private detail immediately on student switch and restores it for the owner without changing hook order', () => {
    const detail = (userId: string) => <Providers user={users.find((user) => user.id === userId)!}>
      <MemoryRouter initialEntries={['/forum/post/private-post']}><Routes>
        <Route path="/forum/post/:postId" element={<ForumPostPage/>}/>
      </Routes></MemoryRouter></Providers>;
    const view = render(detail('s1'));
    expect(screen.getByText('Private body')).toBeInTheDocument();
    view.rerender(detail('sx1'));
    expect(screen.queryByText('Private body')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Post unavailable' })).toBeInTheDocument();
    view.rerender(detail('s1'));
    expect(screen.getByText('Private body')).toBeInTheDocument();
    view.unmount();
    render(detail('sx1')); // A fresh route mount simulates the permission decision after reload.
    expect(screen.queryByText('Private body')).not.toBeInTheDocument();
  });
  it.each<[AppRole, string]>([['teacher', 'v1'], ['teacher', 'v2'], ['student', 'sx1'], ['admin', 'a1']])(
    '%s/%s workspace list cannot disclose private content', (role, userId) => {
      render(<Providers user={users.find((user) => user.id === userId)!}>
        <MemoryRouter initialEntries={[`/workspace/${role}/forum`]}><WorkspacePage role={role}/></MemoryRouter>
      </Providers>);
      expect(screen.queryByText('Private body')).not.toBeInTheDocument();
      expect(screen.getByText('Public body')).toBeInTheDocument();
      if (role === 'teacher') expect(screen.getByText('Teacher body')).toBeInTheDocument();
    });
  it('keeps authorized hidden content available to Admin moderation while denying private bodies', () => {
    render(<Providers user={users.find((user) => user.id === 'a1')!}>
      <MemoryRouter initialEntries={['/workspace/admin/moderation']}><WorkspacePage role="admin"/></MemoryRouter>
    </Providers>);
    expect(screen.getByText('Hidden body')).toBeInTheDocument();
    expect(screen.queryByText('Private body')).not.toBeInTheDocument();
  });
  it('does not disclose private submission titles on the teacher dashboard', () => {
    render(<Providers user={users.find((user) => user.id === 'v1')!}>
      <MemoryRouter initialEntries={['/workspace/teacher']}><WorkspacePage role="teacher"/></MemoryRouter>
    </Providers>);
    expect(screen.queryByText('Private submission')).not.toBeInTheDocument();
    expect(screen.getByText('Shared submission')).toBeInTheDocument();
    expect(screen.getByText('community discussions').previousElementSibling).toHaveTextContent('2');
  });
});
