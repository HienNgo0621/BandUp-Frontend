import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import type { AuthContextValue } from '../../../types/auth';
import type { User } from '../../../types/user';
import { ProtectedRoute } from '../ProtectedRoute';
import { RoleGuard } from '../RoleGuard';

class RouterTestRequest {
  url: string;
  method: string;
  signal: AbortSignal | null;
  headers: Headers;
  body: BodyInit | null;
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    this.url = String(input);
    this.method = init?.method ?? 'GET';
    this.signal = init?.signal ?? null;
    this.headers = new Headers(init?.headers);
    this.body = init?.body ?? null;
  }
}
Object.defineProperty(globalThis, 'Request', { configurable: true, value: RouterTestRequest });

const learner: User = { id: 's1', name: 'Hien Phuong', role: 'student', status: 'active', label: 'Learner' };
const volunteer: User = { id: 'v1', name: 'Phuong Hoang', role: 'teacher', status: 'active', label: 'Teacher / Volunteer' };
function renderAt(path: string, user: User | null) {
  const value: AuthContextValue = { user, role: user?.role ?? 'guest', isAuthenticated: Boolean(user), login: async () => ({ ok: false, reason: 'not-found' }), logout: () => undefined, switchDemoAccount: async () => ({ ok: false, reason: 'not-found' }) };
  const router = createMemoryRouter([
    { element: <ProtectedRoute />, children: [{ element: <RoleGuard allowedRoles={['admin']} />, children: [{ path: '/workspace/admin', element: <p>Admin workspace</p> }] }] },
    { path: '/workspace/student', element: <p>Student workspace</p> },
    { path: '/workspace/teacher', element: <p>Teacher workspace</p> },
    { path: '/login', element: <p>Login route</p> },
  ], { initialEntries: [path] });
  return render(<AuthContext.Provider value={value}><RouterProvider router={router} /></AuthContext.Provider>);
}

describe('workspace route authorization by direct URL', () => {
  it('sends a guest opening an admin URL to login', async () => {
    renderAt('/workspace/admin', null);
    expect(await screen.findByText('Login route')).toBeInTheDocument();
  });
  it('redirects a student who opens the admin URL to their own workspace', async () => {
    renderAt('/workspace/admin', learner);
    expect(await screen.findByText('Student workspace')).toBeInTheDocument();
  });
  it('redirects a teacher who opens the admin URL to their own workspace', async () => {
    renderAt('/workspace/admin', volunteer);
    await waitFor(() => expect(screen.getByText('Teacher workspace')).toBeInTheDocument());
  });
  it('allows the requested admin route only for an admin role', async () => {
    renderAt('/workspace/admin', { id: 'a1', name: 'Admin', role: 'admin', status: 'active', label: 'Administrator' });
    expect(await screen.findByText('Admin workspace')).toBeInTheDocument();
  });
});
