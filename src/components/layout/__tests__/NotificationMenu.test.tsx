import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import { AppDataContext } from '../../../contexts/AppDataContext';
import type { AuthContextValue } from '../../../types/auth';
import { NotificationMenu } from '../NotificationMenu';
import { createEmptyAppData } from '../../../services/demo/seedData';

function CurrentPath() { const location = useLocation(); return <output>{location.pathname}</output>; }

describe('NotificationMenu', () => {
  it('shows read state, marks notifications read, marks all read, and opens related content', () => {
    const markNotificationRead = vi.fn(() => true);
    const markAllNotificationsRead = vi.fn(() => true);
    const auth: AuthContextValue = { user: { id: 's1', name: 'Hien', role: 'student', status: 'active', label: 'Learner' }, role: 'student', isAuthenticated: true, login: async () => ({ ok: false, reason: 'not-found' }), logout: vi.fn(), switchDemoAccount: async () => ({ ok: false, reason: 'not-found' }) };
    const notification = { id: 'n1', recipientId: 's1', content: 'Feedback is ready', createdAt: 100, readBy: [] as string[], relatedRoute: 'feedback', relatedEntityId: 'f1' };
    const initialData = createEmptyAppData();
    const appData = { data: { ...initialData, notifications: [notification] }, users: initialData.users, questionBank: initialData.questionBank, notifications: [notification], updateUser: vi.fn(() => true), replaceQuestionBank: vi.fn(() => true), markNotificationRead, markAllNotificationsRead, refresh: vi.fn() };
    render(<AuthContext.Provider value={auth}><AppDataContext.Provider value={appData}><MemoryRouter initialEntries={['/workspace/student']}><Routes><Route path="*" element={<><NotificationMenu role="student" presentation="header" /><CurrentPath /></>} /></Routes></MemoryRouter></AppDataContext.Provider></AuthContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
    expect(screen.getByText('Feedback is ready')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(markAllNotificationsRead).toHaveBeenCalledWith('s1', 'student');
    fireEvent.click(screen.getByRole('button', { name: /Feedback is ready/ }));
    expect(markNotificationRead).toHaveBeenCalledWith('n1', 's1');
    expect(screen.getByText('/workspace/student/feedback')).toBeInTheDocument();
  });
});
