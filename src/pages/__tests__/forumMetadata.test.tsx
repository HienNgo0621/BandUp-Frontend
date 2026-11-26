import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AppDataProvider } from '../../contexts/AppDataContext';
import { ToastProvider } from '../../components/ui/Toast';
import { createEmptyAppData } from '../../services/demo/seedData';
import type { AppData } from '../../services/appDataService';
import type { ForumPost } from '../../types/forum';
import { STORAGE_KEYS } from '../../services/storage/storageKeys';
import { ForumPage, ForumTopicPage } from '../ForumGuestPages';

const seed = createEmptyAppData();
const secret = 'CONFIDENTIAL synthetic reflection';
const privatePost: ForumPost = { ...seed.forumPosts[0], id: 'qa-private', topicKey: 'qa-private-topic',
  title: secret, body: 'CONFIDENTIAL synthetic body', tags: ['CONFIDENTIAL-private-tag'], visibility: 'ONLY_ME' as const };
function fixture(): AppData {
  return { ...seed, forumPosts: [privatePost], forumTopics: [{ id: 'qa-topic', key: 'qa-private-topic',
    title: secret, description: 'CONFIDENTIAL synthetic description' }] };
}
function route(userId: string | null, path: string) {
  const user = seed.users.find((item) => item.id === userId) ?? null;
  return <AuthContext.Provider value={{ user, role: user?.role ?? 'guest', isAuthenticated: Boolean(user),
    login: async () => ({ ok: false, reason: 'not-found' }), logout: vi.fn() }}>
    <AppDataProvider><ToastProvider><MemoryRouter initialEntries={[path]}><Routes>
      <Route path="/forum" element={<ForumPage/>}/>
      <Route path="/forum/topic/:topicKey" element={<ForumTopicPage/>}/>
    </Routes></MemoryRouter></ToastProvider></AppDataProvider>
  </AuthContext.Provider>;
}
afterEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe('FIX-01A-01: authorized topic metadata — Q02, FR-32/68, PG-019', () => {
  it('retains the private topic title and post for the authorized owner', () => {
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(fixture()));
    render(route('s1', '/forum/topic/qa-private-topic'));
    expect(screen.getByRole('heading', { level: 1, name: secret })).toBeInTheDocument();
    expect(screen.getByText(privatePost.body)).toBeInTheDocument();
  });
  it.each(['sx1', 'v1', null, 'a1'])('denies every confidential rendered fragment to %s on direct URL and fresh provider reload', (userId) => {
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(fixture()));
    for (let reload = 0; reload < 2; reload++) {
      const view = render(route(userId, '/forum/topic/qa-private-topic'));
      expect(view.baseElement.innerHTML).not.toContain('CONFIDENTIAL');
      expect(view.baseElement.innerHTML).not.toContain('qa-private-topic');
      expect(screen.getByRole('heading', { name: 'Topic unavailable' })).toBeInTheDocument();
      view.unmount();
    }
  });
  it.each(['/forum', '/forum/topic/qa-private-topic'])('does not use private-derived title, tag, or excerpt for a mixed topic at %s', (path) => {
    const data = fixture();
    data.forumPosts.push({ ...privatePost, id: 'qa-public', title: 'Public practice topic', body: 'Public practice body',
      tags: ['public-practice'], visibility: 'PUBLIC' });
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(data));
    const view = render(route('v1', path));
    expect(view.baseElement.innerHTML).not.toContain('CONFIDENTIAL');
    expect(screen.getByText('Public practice body')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Public practice topic', level: path.includes('/topic/') ? 1 : 2 })).toBeInTheDocument();
    expect(screen.getAllByText('#public-practice').length).toBeGreaterThan(0);
  });
  it('keeps a public topic accessible without trusting catalog metadata with no source provenance', () => {
    const data = fixture();
    data.forumPosts = [{ ...privatePost, title: 'Public practice topic', body: 'Public practice body', visibility: 'PUBLIC',
      tags: ['public-practice'] }];
    data.forumTopics = [{ id: 'qa-topic', key: 'qa-private-topic', title: 'CONFIDENTIAL orphaned legacy label', description: 'CONFIDENTIAL legacy context' }];
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(data));
    const view = render(route(null, '/forum/topic/qa-private-topic'));
    expect(screen.getByRole('heading', { level: 1, name: 'Public practice topic' })).toBeInTheDocument();
    expect(view.baseElement.innerHTML).not.toContain('CONFIDENTIAL');
    expect(screen.getByText('Public practice body')).toBeInTheDocument();
  });
  it('keeps the documented non-owner Admin TEACHER_ONLY denial without expanding policy', () => {
    const data = { ...fixture(), forumPosts: [{ ...privatePost, visibility: 'TEACHER_ONLY' as const }] };
    localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(data));
    const view = render(route('a1', '/forum/topic/qa-private-topic'));
    expect(view.baseElement.innerHTML).not.toContain('CONFIDENTIAL');
    expect(screen.getByRole('heading', { name: 'Topic unavailable' })).toBeInTheDocument();
  });
});
