# BandUp IELTS – Phase 1 source code listing

This document contains the complete contents of the project source/configuration files. The ZIP archive is the recommended way to use the project.

## `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#F7F7F7" />
    <meta name="description" content="BandUp IELTS – IELTS learning, practice, mock exams and teacher feedback." />
    <title>BandUp IELTS – Learning &amp; Exam Preparation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## `package.json`

```json
{
  "name": "bandup-ielts-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "typecheck": "tsc -b --pretty",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "tailwindcss": "3.4.17",
    "typescript": "~5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

## `postcss.config.cjs`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## `src/App.tsx`

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
```

## `src/app/router.tsx`

```tsx
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import type { AppRole } from '../types/common';
import { ROLE_BASE_PATH, ROLE_NAVIGATION } from '../data/navigation';

function placeholder(title: string, description: string, section?: string): RouteObject {
  return {
    element: <PlaceholderPage title={title} description={description} section={section} />,
  };
}

interface WorkspaceRouteDefinition {
  path: string;
  title: string;
  description: string;
}

const STUDENT_ROUTES: WorkspaceRouteDefinition[] = [
  { path: 'practice/listening', title: 'Listening Practice', description: 'Listening task library and practice workspace.' },
  { path: 'practice/reading', title: 'Reading Practice', description: 'Reading passages, question types and practice sets.' },
  { path: 'practice/writing', title: 'Writing Practice', description: 'Writing Task 1 and Task 2 practice.' },
  { path: 'practice/speaking', title: 'Speaking Practice', description: 'Speaking Part 1, Part 2 and Part 3 practice.' },
  { path: 'mocks', title: 'Mock Tests', description: 'IELTS mock test catalogue and test entry point.' },
  { path: 'forum', title: 'Forum', description: 'Community posts, topics, comments and feedback.' },
  { path: 'study-plan', title: 'Study Plan', description: 'Calendar, learning tasks and study planning.' },
  { path: 'goals', title: 'Band Goals', description: 'Set target IELTS bands for each skill.' },
  { path: 'progress', title: 'Learning Progress', description: 'Review learning activity, progress and streaks.' },
  { path: 'history', title: 'History', description: 'Review previous practice and examination attempts.' },
  { path: 'feedback', title: 'My Feedback', description: 'Review feedback received from Teacher / Volunteers.' },
  { path: 'notes', title: 'Notes', description: 'Personal vocabulary, grammar and learning notes.' },
  { path: 'notifications', title: 'Notifications', description: 'Learning and community notifications.' },
  { path: 'account', title: 'My Account', description: 'Profile information and personal details.' },
  { path: 'settings', title: 'Settings', description: 'Personal preferences and notification settings.' },
  { path: 'help', title: 'Help Center', description: 'Search help topics and product guidance.' },
];

const TEACHER_ROUTES: WorkspaceRouteDefinition[] = [
  { path: 'forum', title: 'Forum', description: 'Find eligible Writing and Speaking correction posts.' },
  { path: 'grading-history', title: 'Grading History', description: 'Review your previous grading records.' },
  { path: 'notifications', title: 'Notifications', description: 'Updates related to your Forum activity and feedback.' },
  { path: 'account', title: 'My Account', description: 'Teacher / Volunteer profile information.' },
  { path: 'settings', title: 'Settings', description: 'Personal preferences and notification settings.' },
  { path: 'help', title: 'Help Center', description: 'Guidance for Teacher / Volunteer workflows.' },
];

const ADMIN_ROUTES: WorkspaceRouteDefinition[] = [
  { path: 'forum', title: 'Forum Management', description: 'Review Forum posts and topics as an administrator.' },
  { path: 'applications', title: 'Applications', description: 'Review Teacher / Volunteer applications.' },
  { path: 'users', title: 'User Management', description: 'Manage student accounts and account status.' },
  { path: 'teachers', title: 'Teacher Management', description: 'Manage Teacher / Volunteer accounts.' },
  { path: 'moderation', title: 'Moderation', description: 'Review community reports and moderation actions.' },
  { path: 'question-bank', title: 'Question Bank', description: 'Create and manage IELTS question sets.' },
  { path: 'quality', title: 'Quality Monitoring', description: 'Review prototype quality and grading activity.' },
  { path: 'access-control', title: 'Access Control', description: 'Review role access and content visibility rules.' },
  { path: 'help-management', title: 'Help Center Management', description: 'Manage public and in-app help articles.' },
  { path: 'notifications', title: 'Notifications', description: 'Administrator notifications.' },
  { path: 'settings', title: 'Settings', description: 'Administrator preferences.' },
  { path: 'help', title: 'Help Center', description: 'Administrator product guidance.' },
];

function buildWorkspaceRoute(
  role: AppRole,
  routeDefinitions: WorkspaceRouteDefinition[],
): RouteObject {
  const roleLabel = role === 'student' ? 'Student' : role === 'teacher' ? 'Teacher / Volunteer' : 'Admin';
  return {
    path: ROLE_BASE_PATH[role],
    element: <AppLayout role={role} />,
    children: [
      {
        index: true,
        element: (
          <PlaceholderPage
            title={`${roleLabel} Home`}
            description={`${roleLabel} workspace shell. The dashboard content will be migrated in a later phase.`}
            section="Phase 1 · Workspace shell"
          />
        ),
      },
      ...routeDefinitions.map((route) => ({
        path: route.path,
        element: (
          <PlaceholderPage
            title={route.title}
            description={route.description}
            section="Phase 1 · Route placeholder"
          />
        ),
      })),
    ],
  };
}

const publicRoutes: RouteObject = {
  path: '/',
  element: <PublicLayout />,
  children: [
    {
      index: true,
      element: (
        <PlaceholderPage
          title="Learn, practise and grow together."
          description="BandUp IELTS is a non-profit, volunteer-run IELTS learning community. This Phase 1 build establishes the React foundation and shared layouts; the complete public page will be migrated in Phase 3."
          section="BandUp IELTS · Foundation preview"
        />
      ),
    },
    { path: 'about', ...placeholder('Our mission', 'Learn about the BandUp IELTS community and its mission.') },
    { path: 'volunteers', ...placeholder('Volunteer Hall of Fame', 'Meet and recognise the volunteers who support the community.') },
    { path: 'faq', ...placeholder('Frequently Asked Questions', 'Browse answers to common questions about BandUp IELTS.') },
    { path: 'contact', ...placeholder('Contact & feedback', 'Get in touch with the BandUp IELTS community.') },
    { path: 'help', ...placeholder('Help Center', 'Search help articles and product guidance.') },
    { path: 'login', ...placeholder('Log in', 'The authentication form will be implemented in Phase 3.') },
    { path: 'signup', ...placeholder('Join BandUp IELTS', 'Choose an account type and begin registration in Phase 3.') },
    { path: 'forgot-password', ...placeholder('Forgot password', 'Password recovery will be implemented with the authentication flow.') },
    { path: 'apply', ...placeholder('Volunteer with us', 'The Teacher / Volunteer application flow will be migrated in Phase 3.') },
    { path: 'application-status', ...placeholder('Application status', 'Review the status of a Teacher / Volunteer application.') },
    { path: 'practice/listening', ...placeholder('Listening Practice', 'Guest preview for Listening practice.') },
    { path: 'practice/reading', ...placeholder('Reading Practice', 'Guest preview for Reading practice.') },
    { path: 'practice/writing', ...placeholder('Writing Practice', 'Guest preview for Writing practice.') },
    { path: 'practice/speaking', ...placeholder('Speaking Practice', 'Guest preview for Speaking practice.') },
    { path: 'mocks', ...placeholder('Mock Tests', 'Guest preview for full IELTS mock tests.') },
    { path: 'forum', ...placeholder('Forum', 'Guest preview for public community posts.') },
    { path: 'privacy', ...placeholder('Privacy', 'Privacy information will be migrated with the public content.') },
    { path: 'guidelines', ...placeholder('Community Guidelines', 'Community guidelines will be migrated with the public content.') },
  ],
};

export const router = createBrowserRouter([
  publicRoutes,
  buildWorkspaceRoute('student', STUDENT_ROUTES),
  buildWorkspaceRoute('teacher', TEACHER_ROUTES),
  buildWorkspaceRoute('admin', ADMIN_ROUTES),
  { path: '*', element: <NotFoundPage /> },
]);

export const workspaceRouteCounts = {
  student: ROLE_NAVIGATION.student.length + STUDENT_ROUTES.length,
  teacher: ROLE_NAVIGATION.teacher.length + TEACHER_ROUTES.length,
  admin: ROLE_NAVIGATION.admin.length + ADMIN_ROUTES.length,
};
```

## `src/components/layout/AppHeader.tsx`

```tsx
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { PUBLIC_PRACTICE_ITEMS, ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAVIGATION, ROLE_NAMES } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';

export interface AppHeaderProps {
  role: AppRole;
  onOpenMobileNav: () => void;
}

export function AppHeader({ role, onOpenMobileNav }: AppHeaderProps) {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const basePath = ROLE_BASE_PATH[role];

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button
          type="button"
          className="app-mobile-menu-button"
          onClick={onOpenMobileNav}
          aria-label="Open workspace navigation"
        >
          <Icon name="menu" size={23} />
        </button>

        <Link to={basePath} className="brand-lockup app-brand" aria-label="BandUp IELTS workspace home">
          <span className="logo-mark">BU</span>
          <span className="app-brand-name">BandUp IELTS</span>
        </Link>

        {role === 'student' ? (
          <nav className="student-desktop-nav" aria-label="Student navigation">
            <NavLink to={basePath} end className={({ isActive }) => `tn ${isActive ? 'on' : ''}`}>
              Home
            </NavLink>
            <div className="nav-dropdown-wrap">
              <button
                type="button"
                className={`tn nav-dropdown-trigger ${practiceOpen ? 'on' : ''}`}
                onClick={() => setPracticeOpen((current) => !current)}
                aria-expanded={practiceOpen}
              >
                Practice <Icon name="chevron-down" size={15} />
              </button>
              {practiceOpen ? (
                <div className="nav-dropdown card">
                  {PUBLIC_PRACTICE_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={`${basePath}${item.to.replace('/practice', '/practice')}`}
                      className="nav-dropdown-link"
                      onClick={() => setPracticeOpen(false)}
                    >
                      {item.icon ? <Icon name={item.icon} size={17} /> : null}
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <NavLink to={`${basePath}/mocks`} className={({ isActive }) => `tn ${isActive ? 'on' : ''}`}>
              Mock Tests
            </NavLink>
            <NavLink to={`${basePath}/forum`} className={({ isActive }) => `tn ${isActive ? 'on' : ''}`}>
              Forum
            </NavLink>
          </nav>
        ) : null}

        <div className="app-header-actions">
          <Link
            to={`${basePath}/notifications`}
            className="app-header-icon-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <Icon name="bell" size={20} />
          </Link>
          <div className="app-user-summary">
            <span className="app-user-avatar">{ROLE_NAMES[role].split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
            <span className="app-user-copy">
              <strong>{ROLE_NAMES[role]}</strong>
              <small>{ROLE_LABELS[role]}</small>
            </span>
          </div>
        </div>
      </div>
      {role !== 'student' ? (
        <div className="app-header-role-line" aria-label="Current workspace role">
          <span>{ROLE_LABELS[role]} workspace</span>
          <span className="app-header-role-links">
            {ROLE_NAVIGATION[role].slice(0, 3).map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </span>
        </div>
      ) : null}
    </header>
  );
}
```

## `src/components/layout/AppSidebar.tsx`

```tsx
import { NavLink } from 'react-router-dom';
import { ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAVIGATION } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';

export interface AppSidebarProps {
  role: AppRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ role, collapsed, onToggle }: AppSidebarProps) {
  if (role === 'student') return null;

  return (
    <aside className={`sb app-sidebar ${collapsed ? 'sbc' : ''}`} aria-label="Workspace sidebar">
      <div className="sidebar-brand-row">
        <NavLink to={ROLE_BASE_PATH[role]} className="sidebar-brand">
          <span className="logo-mark">BU</span>
          <span className="sbl">BandUp IELTS</span>
        </NavLink>
      </div>

      <button
        type="button"
        className="sbt sidebar-collapse-button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="sbl sidebar-menu-label">{ROLE_LABELS[role]}</span>
        <Icon name="chevron-left" size={17} className={collapsed ? 'sidebar-collapse-icon is-collapsed' : 'sidebar-collapse-icon'} />
      </button>

      <nav className="sidebar-nav" aria-label={`${ROLE_LABELS[role]} navigation`}>
        {ROLE_NAVIGATION[role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav ${isActive ? 'on' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            {item.icon ? <Icon name={item.icon} size={19} /> : null}
            <span className="sbl sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to={`${ROLE_BASE_PATH[role]}/settings`} className="nav">
          <Icon name="settings" size={19} />
          <span className="sbl sidebar-link-label">Settings</span>
        </NavLink>
        <NavLink to={`${ROLE_BASE_PATH[role]}/help`} className="nav">
          <Icon name="help-circle" size={19} />
          <span className="sbl sidebar-link-label">Help Center</span>
        </NavLink>
      </div>
    </aside>
  );
}
```

## `src/components/layout/MobileNav.tsx`

```tsx
import { NavLink } from 'react-router-dom';
import { PUBLIC_PRACTICE_ITEMS, ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAVIGATION } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';

export interface MobileNavProps {
  role: AppRole;
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ role, open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="mobile-nav-layer">
      <button type="button" className="mobile-nav-backdrop" onClick={onClose} aria-label="Close navigation" />
      <aside className="mobile-nav-panel" aria-label={`${ROLE_LABELS[role]} mobile navigation`}>
        <div className="mobile-nav-heading-row">
          <NavLink to={ROLE_BASE_PATH[role]} className="brand-lockup" onClick={onClose}>
            <span className="logo-mark">BU</span>
            <span>BandUp IELTS</span>
          </NavLink>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close navigation">
            <Icon name="x" />
          </button>
        </div>
        <nav className="mobile-app-nav">
          {role === 'student' ? (
            <>
              {ROLE_NAVIGATION[role].slice(0, 1).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`} onClick={onClose}>
                  {item.icon ? <Icon name={item.icon} size={19} /> : null}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <p className="mobile-nav-heading">Practice</p>
              {PUBLIC_PRACTICE_ITEMS.map((item) => (
                <NavLink key={item.to} to={`${ROLE_BASE_PATH.student}${item.to}`} className="nav" onClick={onClose}>
                  {item.icon ? <Icon name={item.icon} size={19} /> : null}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              {ROLE_NAVIGATION[role].slice(1).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`} onClick={onClose}>
                  {item.icon ? <Icon name={item.icon} size={19} /> : null}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          ) : ROLE_NAVIGATION[role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav ${isActive ? 'on' : ''}`}
              onClick={onClose}
            >
              {item.icon ? <Icon name={item.icon} size={19} /> : null}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
```

## `src/components/layout/PublicFooter.tsx`

```tsx
import { Link } from 'react-router-dom';

const practiceLinks = [
  { label: 'Listening', to: '/practice/listening' },
  { label: 'Reading', to: '/practice/reading' },
  { label: 'Writing', to: '/practice/writing' },
  { label: 'Speaking', to: '/practice/speaking' },
  { label: 'Mock Tests', to: '/mocks' },
];

const exploreLinks = [
  { label: 'Forum', to: '/forum' },
  { label: 'Our mission', to: '/about' },
  { label: 'Volunteer Hall of Fame', to: '/volunteers' },
  { label: 'Help Center', to: '/help' },
  { label: 'FAQ', to: '/faq' },
];

const joinLinks = [
  { label: 'Log in', to: '/login' },
  { label: 'Join as a student', to: '/signup' },
  { label: 'Volunteer with us', to: '/apply' },
];

function FooterColumn({ title, links }: { title: string; links: typeof practiceLinks }) {
  return (
    <div>
      <h2 className="footer-column-title">{title}</h2>
      <ul className="footer-link-list">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        <div className="public-footer-about">
          <p className="footer-brand">
            <span className="logo-mark">BU</span>
            <span>BandUp IELTS</span>
          </p>
          <p>A non-profit IELTS practice community.</p>
        </div>
        <FooterColumn title="Practice" links={practiceLinks} />
        <FooterColumn title="Explore" links={exploreLinks} />
        <FooterColumn title="Join us" links={joinLinks} />
      </div>
      <div className="public-footer-bottom">
        <p>© 2026 BandUp IELTS Community · A non-profit, volunteer-run project</p>
        <div className="footer-legal-links">
          <Link to="/help">Help Center</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/guidelines">Guidelines</Link>
        </div>
      </div>
    </footer>
  );
}
```

## `src/components/layout/PublicHeader.tsx`

```tsx
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { PUBLIC_ABOUT_ITEMS, PUBLIC_PRACTICE_ITEMS } from '../../data/navigation';
import { Icon } from '../ui/Icon';

function getNavClass(isActive: boolean) {
  return `tn ${isActive ? 'on' : ''}`;
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const closeMenus = () => {
    setMobileOpen(false);
    setPracticeOpen(false);
    setAboutOpen(false);
  };

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/" className="brand-lockup" onClick={closeMenus} aria-label="BandUp IELTS home">
          <span className="logo-mark">BU</span>
          <span>BandUp IELTS</span>
        </Link>

        <nav className="public-desktop-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => getNavClass(isActive)}>
            Home
          </NavLink>

          <div className="nav-dropdown-wrap">
            <button
              type="button"
              className={`tn nav-dropdown-trigger ${practiceOpen ? 'on' : ''}`}
              aria-expanded={practiceOpen}
              onClick={() => {
                setPracticeOpen((current) => !current);
                setAboutOpen(false);
              }}
            >
              Practice <Icon name="chevron-down" size={15} />
            </button>
            {practiceOpen ? (
              <div className="nav-dropdown card">
                {PUBLIC_PRACTICE_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-dropdown-link" onClick={closeMenus}>
                    {item.icon ? <Icon name={item.icon} size={17} /> : null}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>

          <NavLink to="/mocks" className={({ isActive }) => getNavClass(isActive)}>
            Mock Tests
          </NavLink>
          <NavLink to="/forum" className={({ isActive }) => getNavClass(isActive)}>
            Forum
          </NavLink>

          <div className="nav-dropdown-wrap">
            <button
              type="button"
              className={`tn nav-dropdown-trigger ${aboutOpen ? 'on' : ''}`}
              aria-expanded={aboutOpen}
              onClick={() => {
                setAboutOpen((current) => !current);
                setPracticeOpen(false);
              }}
            >
              About <Icon name="chevron-down" size={15} />
            </button>
            {aboutOpen ? (
              <div className="nav-dropdown card">
                {PUBLIC_ABOUT_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-dropdown-link" onClick={closeMenus}>
                    {item.icon ? <Icon name={item.icon} size={17} /> : null}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="public-auth-actions">
          <Link to="/login" className="tn">
            Log in
          </Link>
          <Link to="/signup" className="btn b1">
            Join us
          </Link>
        </div>

        <button
          type="button"
          className="public-mobile-toggle"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          <Icon name={mobileOpen ? 'x' : 'menu'} size={24} />
        </button>
      </div>

      {mobileOpen ? (
        <nav className="public-mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/" end className="nav" onClick={closeMenus}>Home</NavLink>
          <p className="mobile-nav-heading">Practice</p>
          {PUBLIC_PRACTICE_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav" onClick={closeMenus}>
              {item.icon ? <Icon name={item.icon} size={19} /> : null}
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/mocks" className="nav" onClick={closeMenus}>Mock Tests</NavLink>
          <NavLink to="/forum" className="nav" onClick={closeMenus}>Forum</NavLink>
          <p className="mobile-nav-heading">About</p>
          {PUBLIC_ABOUT_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav" onClick={closeMenus}>
              {item.icon ? <Icon name={item.icon} size={19} /> : null}
              {item.label}
            </NavLink>
          ))}
          <div className="public-mobile-auth">
            <Link to="/login" className="btn b4" onClick={closeMenus}>Log in</Link>
            <Link to="/signup" className="btn b1" onClick={closeMenus}>Join us</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
```

## `src/components/ui/Badge.tsx`

```tsx
import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate' | 'sky';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'slate', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={['bdg', `bdg-${variant}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  );
}
```

## `src/components/ui/Button.tsx`

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'dark' | 'soft' | 'outline' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'b1',
  dark: 'b2',
  soft: 'b3',
  outline: 'b4',
  destructive: 'b5',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'button-size-sm',
  md: 'button-size-md',
  lg: 'button-size-lg',
  icon: 'ico',
};

export function Button({
  variant = 'primary',
  size = 'md',
  busy = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
```

## `src/components/ui/Card.tsx`

```tsx
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  children: ReactNode;
  interactive?: boolean;
}

export function Card({
  as: Element = 'div',
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const classes = ['card', interactive ? 'is-link' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Element className={classes} {...props}>
      {children}
    </Element>
  );
}
```

## `src/components/ui/Icon.tsx`

```tsx
import type { SVGProps } from 'react';
import type { IconName } from '../../types/navigation';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-7h6v7',
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 14h4v7H5a2 2 0 0 1-2-2v-5Zm18 0h-4v7h2a2 2 0 0 0 2-2v-5Z',
  'book-open': 'M12 7v14m0-14C10.5 5.8 8.5 5 6 5S2 5.8 2 7v12c0-1.2 2-2 4-2s4 .8 6 2m0-12c1.5-1.2 3.5-2 6-2s4 .8 4 2v12c0-1.2-2-2-4-2s-4 .8-6 2',
  'pen-line': 'm12 20 9-9-3-3-9 9-1 4 4-1Zm4-14 3 3M4 20h4',
  mic: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm-7 9a7 7 0 0 0 14 0m-7 7v4m-4 0h8',
  layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  'message-circle': 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z',
  'file-check': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6m-12 5 2.5 2.5L17 12',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.8m2 3.2a4 4 0 0 1 2 3.5V21',
  user: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  'shield-check': 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 3v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6m-16 6c0 1.7 3.6 3 8 3s8-1.3 8-3',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4a8.2 8.2 0 0 0-.1-1.3l1.5-1.2-1.5-2.6-1.8.6a8 8 0 0 0-2.2-1.3L15.6 4h-3.2l-.3 2.2a8 8 0 0 0-2.2 1.3l-1.8-.6-1.5 2.6 1.5 1.2a8.2 8.2 0 0 0 0 2.6l-1.5 1.2 1.5 2.6 1.8-.6a8 8 0 0 0 2.2 1.3l.3 2.2h3.2l.3-2.2a8 8 0 0 0 2.2-1.3l1.8.6 1.5-2.6-1.5-1.2A8.2 8.2 0 0 0 20 12Z',
  'help-circle': 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  x: 'm6 6 12 12M18 6 6 18',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-left': 'm15 18-6-6 6-6',
  'log-out': 'M10 17l5-5-5-5m5 5H3m9-9h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6',
  search: 'm20 20-4.5-4.5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
  chart: 'M4 19V5m0 14h17M8 15l3-4 3 2 5-7',
  'clipboard-list': 'M9 4h6m-5-2h4a2 2 0 0 1 2 2v1h3v17H5V5h3V4a2 2 0 0 1 2-2Zm-1 9h6m-6 4h6m-6 4h4',
  'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h3m-3 4h8',
  sliders: 'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6',
  'book-marked': 'M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2Zm3 5h6',
  sparkles: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14Z',
  'arrow-right': 'M4 12h16m-7-7 7 7-7 7',
  'external-link': 'M14 4h6v6m-11 3L20 4M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5',
  info: 'M12 16v-4m0-4h.01m8.99 4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  check: 'm5 12 4 4L19 6',
  'alert-circle': 'M12 8v4m0 4h.01m8.99-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  plus: 'M12 5v14m-7-7h14',
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className = '', ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
```

## `src/components/ui/Input.tsx`

```tsx
import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, leadingIcon, className = '', id, ...props },
  ref,
) {
  const generatedId = useId().replace(/:/g, '');
  const inputId = id ?? `bandup-input-${generatedId}`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="input-field">
      {label ? (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="input-control-wrap">
        {leadingIcon ? <span className="input-leading-icon">{leadingIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={['inp', leadingIcon ? 'inp-with-icon' : '', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperText || error ? helperId : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p id={helperId} className="input-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="input-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
```

## `src/components/ui/Modal.tsx`

```tsx
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'modal-size-sm',
  md: 'modal-size-md',
  lg: 'modal-size-lg',
  xl: 'modal-size-xl',
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = 'bandup-modal-title';
  const descriptionId = 'bandup-modal-description';

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (focusTarget ?? dialogRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const portalTarget = document.getElementById('modal-root') ?? document.body;

  return createPortal(
    <div
      className="modal-backdrop scrim"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`dlg fi modal-panel ${SIZE_CLASS[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <div>
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-content">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    portalTarget,
  );
}
```

## `src/components/ui/Toast.tsx`

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, message, variant }].slice(-4));
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);
  const portalTarget = typeof document === 'undefined'
    ? null
    : document.getElementById('toast-root') ?? document.body;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portalTarget
        ? createPortal(
            <div className="toast-viewport" aria-live="polite" aria-atomic="false">
              {items.map((item) => (
                <ToastItemView key={item.id} item={item} onDismiss={dismissToast} />
              ))}
            </div>,
            portalTarget,
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(item.id), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [item.id, onDismiss]);

  const iconName = item.variant === 'success'
    ? 'check'
    : item.variant === 'warning' || item.variant === 'error'
      ? 'alert-circle'
      : 'info';

  return (
    <div className={`toast-item toast-${item.variant} fi`} role="status">
      <Icon name={iconName} size={18} />
      <p>{item.message}</p>
      <button type="button" onClick={() => onDismiss(item.id)} aria-label="Dismiss notification">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }
  return context;
}
```

## `src/components/ui/__tests__/Button.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders its visible label', () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('calls onClick when activated by the user', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continue</Button>);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables itself while busy', () => {
    render(<Button busy>Processing</Button>);

    expect(screen.getByRole('button', { name: 'Processing' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Processing' })).toHaveAttribute('aria-busy', 'true');
  });
});
```

## `src/components/ui/__tests__/Input.test.tsx`

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('connects the label to the input', () => {
    render(<Input label="Email address" type="email" />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('shows validation error accessibly', () => {
    render(<Input label="Email address" error="Enter a valid email address." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Display name" />);

    await user.type(screen.getByLabelText('Display name'), 'BandUp');

    expect(screen.getByLabelText('Display name')).toHaveValue('BandUp');
  });
});
```

## `src/data/navigation.ts`

```ts
import type { AppRole } from '../types/common';
import type { NavigationItem } from '../types/navigation';

export const PUBLIC_PRACTICE_ITEMS: NavigationItem[] = [
  { label: 'Listening', to: '/practice/listening', icon: 'headphones' },
  { label: 'Reading', to: '/practice/reading', icon: 'book-open' },
  { label: 'Writing', to: '/practice/writing', icon: 'pen-line' },
  { label: 'Speaking', to: '/practice/speaking', icon: 'mic' },
];

export const PUBLIC_ABOUT_ITEMS: NavigationItem[] = [
  { label: 'Our mission', to: '/about', icon: 'sparkles' },
  { label: 'Volunteer Hall of Fame', to: '/volunteers', icon: 'users' },
  { label: 'Contact & feedback', to: '/contact', icon: 'user' },
  { label: 'Help Center', to: '/help', icon: 'help-circle' },
  { label: 'FAQ', to: '/faq', icon: 'info' },
];

export const ROLE_BASE_PATH: Record<AppRole, string> = {
  student: '/workspace/student',
  teacher: '/workspace/teacher',
  admin: '/workspace/admin',
};

export const ROLE_NAVIGATION: Record<AppRole, NavigationItem[]> = {
  student: [
    { label: 'Home', to: ROLE_BASE_PATH.student, icon: 'home', end: true },
    { label: 'Mock Tests', to: `${ROLE_BASE_PATH.student}/mocks`, icon: 'layers' },
    { label: 'Forum', to: `${ROLE_BASE_PATH.student}/forum`, icon: 'message-circle' },
    { label: 'Study Plan', to: `${ROLE_BASE_PATH.student}/study-plan`, icon: 'calendar' },
    { label: 'Band Goals', to: `${ROLE_BASE_PATH.student}/goals`, icon: 'chart' },
    { label: 'Learning Progress', to: `${ROLE_BASE_PATH.student}/progress`, icon: 'chart' },
    { label: 'History', to: `${ROLE_BASE_PATH.student}/history`, icon: 'clock' },
    { label: 'My Feedback', to: `${ROLE_BASE_PATH.student}/feedback`, icon: 'file-check' },
    { label: 'Notes', to: `${ROLE_BASE_PATH.student}/notes`, icon: 'book-marked' },
    { label: 'Notifications', to: `${ROLE_BASE_PATH.student}/notifications`, icon: 'bell' },
  ],
  teacher: [
    { label: 'Home', to: ROLE_BASE_PATH.teacher, icon: 'home', end: true },
    { label: 'Forum', to: `${ROLE_BASE_PATH.teacher}/forum`, icon: 'message-circle' },
    { label: 'Grading History', to: `${ROLE_BASE_PATH.teacher}/grading-history`, icon: 'clock' },
    { label: 'Notifications', to: `${ROLE_BASE_PATH.teacher}/notifications`, icon: 'bell' },
  ],
  admin: [
    { label: 'Home', to: ROLE_BASE_PATH.admin, icon: 'home', end: true },
    { label: 'Forum', to: `${ROLE_BASE_PATH.admin}/forum`, icon: 'message-circle' },
    { label: 'Applications', to: `${ROLE_BASE_PATH.admin}/applications`, icon: 'file-text' },
    { label: 'Users', to: `${ROLE_BASE_PATH.admin}/users`, icon: 'users' },
    { label: 'Teachers', to: `${ROLE_BASE_PATH.admin}/teachers`, icon: 'user' },
    { label: 'Moderation', to: `${ROLE_BASE_PATH.admin}/moderation`, icon: 'shield-check' },
    { label: 'Question Bank', to: `${ROLE_BASE_PATH.admin}/question-bank`, icon: 'database' },
    { label: 'Quality Monitoring', to: `${ROLE_BASE_PATH.admin}/quality`, icon: 'chart' },
    { label: 'Access Control', to: `${ROLE_BASE_PATH.admin}/access-control`, icon: 'sliders' },
    { label: 'Help Center', to: `${ROLE_BASE_PATH.admin}/help-management`, icon: 'help-circle' },
    { label: 'Notifications', to: `${ROLE_BASE_PATH.admin}/notifications`, icon: 'bell' },
  ],
};

export const ROLE_LABELS: Record<AppRole, string> = {
  student: 'Student',
  teacher: 'Teacher / Volunteer',
  admin: 'Administrator',
};

export const ROLE_NAMES: Record<AppRole, string> = {
  student: 'Hien Phuong',
  teacher: 'Phuong Hoang',
  admin: 'Admin',
};
```

## `src/layouts/AppLayout.tsx`

```tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { AppRole } from '../types/common';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';
import { MobileNav } from '../components/layout/MobileNav';

export interface AppLayoutProps {
  role: AppRole;
}

export function AppLayout({ role }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <AppHeader role={role} onOpenMobileNav={() => setMobileNavOpen(true)} />
      <div className="app-layout-body">
        <AppSidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
        />
        <main id="main" className="app-main">
          <div className="app-main-inner fi">
            <Outlet />
            <footer className="app-shell-footer">
              <span>© 2026 BandUp IELTS Community</span>
              <span>Learning together, one step at a time.</span>
            </footer>
          </div>
        </main>
      </div>
      <MobileNav role={role} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
```

## `src/layouts/PublicLayout.tsx`

```tsx
import { Outlet } from 'react-router-dom';
import { PublicFooter } from '../components/layout/PublicFooter';
import { PublicHeader } from '../components/layout/PublicHeader';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main id="content" className="public-main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
```

## `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/index.css';
import './styles/base.css';
import './styles/components.css';
import './styles/app.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

## `src/pages/NotFoundPage.tsx`

```tsx
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-card card">
        <span className="not-found-icon"><Icon name="search" size={26} /></span>
        <p className="placeholder-section-label">ERROR 404</p>
        <h1 className="serif">Page not found</h1>
        <p>The address may be incorrect, or this route has not been added to the application.</p>
        <Link to="/" className="btn b1">
          Back to home <Icon name="arrow-right" size={17} />
        </Link>
      </div>
    </main>
  );
}
```

## `src/pages/PlaceholderPage.tsx`

```tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  section?: string;
}

const workspaceLinks = [
  { label: 'Student workspace', to: '/workspace/student', description: 'Preview the learner shell.' },
  { label: 'Teacher workspace', to: '/workspace/teacher', description: 'Preview the volunteer shell.' },
  { label: 'Admin workspace', to: '/workspace/admin', description: 'Preview the management shell.' },
];

export function PlaceholderPage({
  title,
  description,
  section = 'Phase 1 · Foundation',
}: PlaceholderPageProps) {
  const location = useLocation();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [sampleValue, setSampleValue] = useState('');

  const isPublicHome = location.pathname === '/';
  const isWorkspace = location.pathname.startsWith('/workspace/');

  return (
    <div className="placeholder-page">
      <div className="placeholder-page-heading">
        <div>
          <div className="placeholder-eyebrow">
            <Badge variant="green">{section}</Badge>
            <span className="placeholder-route">{location.pathname}</span>
          </div>
          <h1 className="serif placeholder-title">{title}</h1>
          <p className="placeholder-description">{description}</p>
        </div>
        <div className="placeholder-mark" aria-hidden="true">
          <span className="logo-mark">BU</span>
        </div>
      </div>

      <Card className="placeholder-notice">
        <div className="placeholder-notice-icon">
          <Icon name="info" size={21} />
        </div>
        <div>
          <h2>Foundation is ready. Feature migration comes next.</h2>
          <p>
            This route is registered and uses the new React layout. Its original business logic and
            page-specific interface will be migrated in a later phase; no login, exam, Forum or data
            operation is implemented in this foundation build.
          </p>
        </div>
      </Card>

      <div className="placeholder-demo-grid">
        <Card className="placeholder-demo-card">
          <div className="placeholder-card-topline">
            <span className="placeholder-section-label">UI COMPONENT CHECK</span>
            <Badge variant="blue">Interactive</Badge>
          </div>
          <h2>Design System components</h2>
          <p>Use these controls to verify the shared UI primitives before feature pages are migrated.</p>
          <div className="placeholder-input-area">
            <Input
              label="Sample input"
              placeholder="Type something to test the input component"
              value={sampleValue}
              onChange={(event) => setSampleValue(event.target.value)}
              helperText="This value is temporary and is not saved."
            />
          </div>
          <div className="placeholder-action-row">
            <Button
              variant="primary"
              leftIcon={<Icon name="check" size={17} />}
              onClick={() => showToast(sampleValue.trim() ? `Input received: ${sampleValue.trim()}` : 'The input is empty.', sampleValue.trim() ? 'success' : 'warning')}
            >
              Test toast
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </div>
        </Card>

        <Card className="placeholder-demo-card">
          <div className="placeholder-card-topline">
            <span className="placeholder-section-label">ROUTE PREVIEW</span>
            <Badge variant="slate">No authentication yet</Badge>
          </div>
          <h2>{isWorkspace ? 'Switch workspace preview' : 'Preview role layouts'}</h2>
          <p>
            The three workspace routes are available to inspect their layout shells. They are not
            protected by authentication in Phase 1.
          </p>
          <div className="workspace-preview-list">
            {workspaceLinks.map((item) => (
              <Link key={item.to} to={item.to} className="workspace-preview-link">
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <Icon name="arrow-right" size={18} />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {isPublicHome ? (
        <div className="placeholder-route-shortcuts">
          <h2>Public route shortcuts</h2>
          <div className="route-chip-list">
            <Link to="/practice/listening">Listening</Link>
            <Link to="/practice/reading">Reading</Link>
            <Link to="/practice/writing">Writing</Link>
            <Link to="/practice/speaking">Speaking</Link>
            <Link to="/mocks">Mock Tests</Link>
            <Link to="/forum">Forum</Link>
            <Link to="/about">About</Link>
            <Link to="/faq">FAQ</Link>
          </div>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title="Phase 1 modal test"
        description="This is a shared modal primitive. It is not connected to a business action."
        onClose={() => setModalOpen(false)}
        size="sm"
        footer={(
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close dialog
          </Button>
        )}
      >
        <p className="modal-demo-copy">
          The dialog supports Escape to close, backdrop dismissal, focus restoration and a responsive
          maximum height.
        </p>
      </Modal>
    </div>
  );
}
```

## `src/styles/app.css`

```css
/* Phase 1 application shell and reusable UI primitives. */
* {
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

#root {
  min-height: 100vh;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--color-primary);
  font-family: 'Plus Jakarta Sans', Inter, sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  white-space: nowrap;
}

.logo-mark {
  min-width: 2rem;
  min-height: 2rem;
}

.button-size-sm {
  min-height: 36px;
  padding: 0.45rem 0.8rem;
  font-size: 0.8125rem;
}

.button-size-md {
  min-height: var(--h-ctl);
}

.button-size-lg {
  min-height: 50px;
  padding: 0.8rem 1.35rem;
}

.input-field {
  display: grid;
  gap: 0.45rem;
  width: 100%;
}

.input-label {
  color: var(--color-text-primary);
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
}

.input-control-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-leading-icon {
  position: absolute;
  left: 0.85rem;
  display: inline-flex;
  align-items: center;
  color: var(--color-icon-muted);
  pointer-events: none;
}

.inp-with-icon {
  padding-left: 2.65rem;
}

.input-helper,
.input-error {
  margin: 0;
  font-size: var(--fs-xs);
  line-height: 1.45;
}

.input-helper {
  color: var(--color-text-secondary);
}

.input-error {
  color: var(--color-danger);
}

.public-layout {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: var(--color-canvas);
}

.public-main {
  flex: 1;
  width: 100%;
}

.public-header {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--color-border);
  background: rgb(255 255 255 / 95%);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

.public-header-inner {
  display: flex;
  width: min(100%, 80rem);
  min-height: 4rem;
  align-items: center;
  gap: 1rem;
  margin: 0 auto;
  padding: 0.5rem 1.25rem;
}

.public-desktop-nav,
.public-auth-actions,
.student-desktop-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.public-desktop-nav {
  margin-left: 1rem;
}

.public-auth-actions {
  gap: 0.5rem;
  margin-left: auto;
}

.nav-dropdown-wrap {
  position: relative;
}

.nav-dropdown-trigger {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.nav-dropdown {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 0;
  z-index: 60;
  display: grid;
  width: 14.5rem;
  gap: 0.2rem;
  padding: 0.4rem;
}

.nav-dropdown-link {
  display: flex;
  min-height: 2.55rem;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.7rem;
  border-radius: var(--r-md);
  color: var(--color-text-secondary);
  font-size: var(--fs-sm);
  transition: background-color var(--dur) var(--ease), color var(--dur) var(--ease);
}

.nav-dropdown-link:hover,
.nav-dropdown-link.active {
  background: var(--color-brand-soft);
  color: var(--color-primary);
}

.public-mobile-toggle,
.app-mobile-menu-button {
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
}

.public-mobile-nav {
  display: none;
  max-height: calc(100dvh - 4rem);
  overflow-y: auto;
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.mobile-nav-heading {
  margin: 0.8rem 0 0.3rem;
  padding: 0.25rem 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.public-mobile-auth {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  padding-top: 1rem;
}

.public-footer {
  margin-top: 4rem;
  background: #112a1e;
  color: #e6f4ec;
}

.public-footer-grid {
  display: grid;
  width: min(100%, 80rem);
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 2.5rem;
  margin: 0 auto;
  padding: 3.5rem 1.25rem;
}

.public-footer-about p:last-child {
  max-width: 17rem;
  margin-top: 1rem;
  color: #bfd0c6;
  font-size: var(--fs-sm);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  color: #fff;
  font-family: 'Plus Jakarta Sans', Inter, sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
}

.footer-column-title {
  margin: 0 0 0.9rem;
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: 800;
}

.footer-link-list {
  display: grid;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #c4d2ca;
  font-size: var(--fs-sm);
}

.footer-link-list a:hover,
.footer-legal-links a:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.public-footer-bottom {
  display: flex;
  width: min(100%, 80rem);
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 auto;
  padding: 1.2rem 1.25rem;
  border-top: 1px solid rgb(230 244 236 / 18%);
  color: #c4d2ca;
  font-size: var(--fs-xs);
}

.public-footer-bottom p {
  margin: 0;
}

.footer-legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: var(--color-canvas);
}

.app-header {
  position: relative;
  z-index: 35;
  flex: none;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-header-inner {
  display: flex;
  width: min(100%, 90rem);
  min-height: 4rem;
  align-items: center;
  gap: 0.8rem;
  margin: 0 auto;
  padding: 0.45rem 1.25rem;
}

.app-brand {
  margin-right: 0.4rem;
}

.student-desktop-nav {
  margin-left: 0.3rem;
}

.app-header-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-left: auto;
}

.app-header-icon-button {
  display: inline-flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  color: var(--color-text-secondary);
}

.app-header-icon-button:hover {
  background: var(--color-brand-soft);
  color: var(--color-primary);
}

.app-user-summary {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.app-user-avatar {
  display: inline-flex;
  width: 2.35rem;
  height: 2.35rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
}

.app-user-copy {
  display: grid;
  gap: 0.05rem;
}

.app-user-copy strong {
  color: var(--color-text-primary);
  font-size: 0.78rem;
  line-height: 1.3;
}

.app-user-copy small {
  color: var(--color-text-secondary);
  font-size: 0.68rem;
}

.app-header-role-line {
  display: flex;
  min-height: 2.3rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.35rem max(1.25rem, calc((100% - 90rem) / 2 + 1.25rem));
  border-top: 1px solid var(--color-border);
  background: var(--color-page-bg);
  color: var(--color-text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
}

.app-header-role-links {
  display: flex;
  gap: 1.1rem;
}

.app-header-role-links a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.app-layout-body {
  display: flex;
  min-height: 0;
  flex: 1;
}

.app-sidebar {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 0.75rem;
  border-right: 1px solid var(--color-border);
  overflow-x: hidden;
  overflow-y: auto;
}

.app-sidebar.sbc {
  width: 4.25rem;
}

.sidebar-brand-row {
  min-height: 2.8rem;
  padding: 0 0.25rem 0.35rem;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.4rem;
  color: var(--color-primary);
  font-family: 'Plus Jakarta Sans', Inter, sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  white-space: nowrap;
}

.sidebar-collapse-button {
  width: 100%;
  min-height: 2.35rem;
  margin-bottom: 0.35rem;
  cursor: pointer;
}

.sidebar-menu-label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-collapse-icon {
  transition: transform 180ms ease;
}

.sidebar-collapse-icon.is-collapsed {
  transform: rotate(180deg);
}

.sidebar-nav {
  display: grid;
  gap: 0.2rem;
}

.sidebar-link-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-bottom {
  display: grid;
  gap: 0.2rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.app-main {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.app-main-inner {
  width: min(100%, 76rem);
  min-height: 100%;
  margin: 0 auto;
}

.app-shell-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-top: 3rem;
  padding: 1rem 0 0.25rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.72rem;
}

.mobile-nav-layer {
  position: fixed;
  z-index: 80;
  inset: 0;
}

.mobile-nav-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  border: 0;
  background: rgb(9 23 16 / 55%);
}

.mobile-nav-panel {
  position: absolute;
  inset: 0 auto 0 0;
  display: flex;
  width: min(19rem, calc(100vw - 3rem));
  flex-direction: column;
  padding: 1rem;
  background: var(--color-surface);
  box-shadow: var(--sh-3);
  animation: mobile-nav-in 180ms var(--ease);
}

.mobile-nav-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.mobile-app-nav {
  display: grid;
  gap: 0.25rem;
  overflow-y: auto;
  padding-top: 0.8rem;
}

@keyframes mobile-nav-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.placeholder-page {
  width: min(100%, 72rem);
  margin: 0 auto;
  padding: 1rem 0 2rem;
}

.placeholder-page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
}

.placeholder-eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.8rem;
}

.placeholder-route {
  color: var(--color-text-muted);
  font-family: Inter, sans-serif;
  font-size: 0.72rem;
}

.placeholder-title {
  max-width: 48rem;
  margin: 0;
  font-size: clamp(1.85rem, 4vw, 2.7rem);
  line-height: 1.15;
}

.placeholder-description {
  max-width: 49rem;
  margin: 0.75rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.98rem;
  line-height: 1.65;
}

.placeholder-mark {
  display: flex;
  width: 4rem;
  height: 4rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 1.1rem;
  background: var(--color-brand-soft);
}

.placeholder-mark .logo-mark {
  font-size: 1rem;
  padding: 0.55rem 0.65rem;
}

.placeholder-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.1rem 1.2rem;
  border-color: var(--color-brand-line);
  background: var(--color-surface-2);
}

.placeholder-notice-icon {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 0.7rem;
  background: var(--color-surface);
  color: var(--color-primary);
}

.placeholder-notice h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-weight: 800;
}

.placeholder-notice p {
  margin: 0.25rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}

.placeholder-demo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem;
  margin-top: 1.2rem;
}

.placeholder-demo-card {
  padding: 1.35rem;
}

.placeholder-card-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.placeholder-section-label {
  color: var(--color-text-secondary);
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.placeholder-demo-card h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.02rem;
  font-weight: 800;
}

.placeholder-demo-card > p {
  min-height: 3rem;
  margin: 0.45rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}

.placeholder-input-area {
  margin-top: 1.1rem;
}

.placeholder-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.workspace-preview-list {
  display: grid;
  gap: 0.45rem;
  margin-top: 1.1rem;
}

.workspace-preview-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color var(--dur) var(--ease), background-color var(--dur) var(--ease);
}

.workspace-preview-link:hover {
  border-color: var(--color-brand);
  background: var(--color-brand-soft);
}

.workspace-preview-link span {
  display: grid;
  gap: 0.16rem;
}

.workspace-preview-link strong {
  font-size: 0.82rem;
}

.workspace-preview-link small {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.workspace-preview-link > svg {
  flex: none;
  color: var(--color-primary);
}

.placeholder-route-shortcuts {
  margin-top: 1.6rem;
}

.placeholder-route-shortcuts h2 {
  margin: 0 0 0.75rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-weight: 800;
}

.route-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.route-chip-list a {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.route-chip-list a:hover {
  border-color: var(--color-brand);
  background: var(--color-brand-soft);
  color: var(--color-primary);
}

.modal-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
}

.modal-size-sm { max-width: 26rem; }
.modal-size-md { max-width: 34rem; }
.modal-size-lg { max-width: 48rem; }
.modal-size-xl { max-width: 64rem; }

.modal-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modal-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 800;
}

.modal-description {
  margin: 0.35rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
}

.modal-close {
  display: inline-flex;
  width: 2.3rem;
  height: 2.3rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.modal-close:hover {
  background: var(--color-page-bg);
  color: var(--color-text-primary);
}

.modal-content {
  color: var(--color-text-body);
  font-size: 0.9rem;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.modal-demo-copy {
  margin: 0;
}

.toast-viewport {
  position: fixed;
  z-index: 120;
  right: 1rem;
  bottom: 1rem;
  display: grid;
  width: min(25rem, calc(100vw - 2rem));
  gap: 0.55rem;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: var(--r-lg);
  background: #112a1e;
  color: #fff;
  box-shadow: var(--sh-3);
  pointer-events: auto;
}

.toast-item p {
  flex: 1;
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.toast-item button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  opacity: 0.8;
  cursor: pointer;
}

.toast-success > svg { color: #79d6a0; }
.toast-info > svg { color: #7dd3fc; }
.toast-warning > svg { color: #fbbf24; }
.toast-error > svg { color: #fca5a5; }

.not-found-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: var(--color-canvas);
}

.not-found-card {
  display: grid;
  justify-items: center;
  max-width: 30rem;
  padding: 2.5rem;
  text-align: center;
}

.not-found-icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  margin-bottom: 1rem;
  border-radius: 1rem;
  background: var(--color-brand-soft);
  color: var(--color-primary);
}

.not-found-card h1 {
  margin: 0.4rem 0;
  color: var(--color-text-primary);
  font-size: 2rem;
}

.not-found-card p:not(.placeholder-section-label) {
  margin: 0.25rem 0 1.25rem;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
}

@media (max-width: 1023px) {
  .public-desktop-nav,
  .public-auth-actions,
  .student-desktop-nav {
    display: none;
  }

  .public-mobile-toggle,
  .app-mobile-menu-button {
    display: inline-flex;
  }

  .public-mobile-nav {
    display: grid;
    gap: 0.2rem;
  }

  .app-sidebar {
    display: none;
  }

  .app-header-role-line {
    display: none;
  }
}

@media (max-width: 767px) {
  .public-header-inner,
  .app-header-inner {
    padding-right: 0.85rem;
    padding-left: 0.85rem;
  }

  .app-brand-name {
    display: none;
  }

  .app-user-copy {
    display: none;
  }

  .app-main {
    padding: 1rem;
  }

  .placeholder-page {
    padding-top: 0.3rem;
  }

  .placeholder-page-heading {
    gap: 0.8rem;
  }

  .placeholder-mark {
    width: 3.1rem;
    height: 3.1rem;
    border-radius: 0.85rem;
  }

  .placeholder-title {
    font-size: 1.85rem;
  }

  .placeholder-demo-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .public-footer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 1.25rem;
    padding: 2.75rem 1rem;
  }

  .public-footer-about {
    grid-column: 1 / -1;
  }

  .public-footer-bottom {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}

@media (max-width: 420px) {
  .placeholder-notice {
    padding: 0.9rem;
  }

  .placeholder-route {
    display: none;
  }

  .public-footer-grid {
    gap: 1.6rem 0.9rem;
  }

  .app-header-actions {
    gap: 0.35rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-panel {
    animation: none;
  }
}
```

## `src/styles/base.css`

```css
/* Global base styles. Source: BandUp IELTS Prototype v10. */
*,
*::before,
*::after { box-sizing: border-box; }

html,
body,
#root { min-height: 100%; }

body { margin: 0; }

button,
input,
textarea,
select { font: inherit; }

img,
svg { max-width: 100%; }

/* ---------- base ---------- */
html{font-size:15px;scroll-behavior:smooth;scroll-padding-top:env(safe-area-inset-top,0px);box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--color-page-bg);color:var(--color-text-body);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4,.serif{font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif}main h1,main h2,main h3,main h4{color:var(--color-text-primary);letter-spacing:-.01em}
.serif{font-weight:700;letter-spacing:-.025em;line-height:1.15}
::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:var(--color-border-strong);border-radius:10px}
::placeholder{color:var(--color-text-muted);opacity:1}
summary{list-style:none}summary::-webkit-details-marker{display:none}
svg.shrink-0{display:block}.btn svg{margin:0}
main .text-2xl.font-bold{font-size:1.5rem;line-height:2rem}main .text-3xl.font-bold{font-size:1.75rem;line-height:2.25rem}
@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.fi{animation:fi .25s var(--ease)}
:focus-visible{outline:2px solid var(--color-focus-ring);outline-offset:2px;border-radius:var(--r-sm)}
@keyframes spin{to{transform:rotate(360deg)}}
```

## `src/styles/components.css`

```css
/* BandUp IELTS component and feature styles migrated from Prototype v10.
   Feature-specific selectors are intentionally retained for later phases. */
/* =====================================================================
   BandUp IELTS design system — aligned to Design System & UI Specification v1.1
   Official light/dark palette tokens and typography are mapped below.
   Heading: Plus Jakarta Sans · Body/UI: Inter.
   ===================================================================== */
 

/* ---------- buttons: .btn + one variant (b1 primary · b2 strong · b3 soft · b4 outline · b5 destructive) ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.625rem 1.1rem;border-radius:var(--r-md);border:var(--bw) solid transparent;font-weight:var(--fw-semibold);font-size:var(--fs-sm);line-height:1.25;text-align:center;cursor:pointer;transition:background-color var(--dur) var(--ease),border-color var(--dur) var(--ease),box-shadow var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur) var(--ease)}
.btn:active{transform:translateY(1px)}
.b1{background:var(--color-primary);color:#fff;box-shadow:0 1px 2px rgba(22,95,81,.25)}
.b1:hover{background:var(--color-primary-hover)}.b1:active{background:var(--color-primary-active)}
.b2{background:var(--color-ink);color:#fff}.b2:hover{background:var(--color-text-strong)}.b2:active{background:#000}
.b3{background:var(--color-brand-soft);color:var(--color-primary-active);border-color:var(--color-brand-line)}
.b3:hover{background:var(--color-brand-line)}.b3:active{background:#BFE6DD}
.b4{background:var(--color-surface);color:var(--color-text-body);border-color:var(--color-border-strong)}
.b4:hover{background:var(--color-brand-softer);border-color:var(--color-brand);color:var(--color-primary-active)}.b4:active{background:var(--color-brand-soft)}
.b5{background:var(--color-danger-bg);color:var(--color-danger);border-color:var(--color-danger-line)}
.b5:hover{background:#FBD9D5}.b5:active{background:#F7C6C0}
.btn.ico{width:var(--h-ctl);height:var(--h-ctl);padding:0}
.btn[aria-busy=true]{position:relative;color:transparent!important;pointer-events:none}
.btn[aria-busy=true]::after{content:'';position:absolute;width:1rem;height:1rem;border-radius:9999px;border:2px solid #fff;border-top-color:transparent;animation:spin .7s linear infinite}
.b4[aria-busy=true]::after,.b3[aria-busy=true]::after{border-color:var(--color-primary);border-top-color:transparent}
.btn:disabled,.btn[disabled]{background:var(--color-page-bg);color:var(--color-text-muted);border:var(--bw) solid var(--color-border);cursor:not-allowed;box-shadow:none;transform:none}
/* Guest preview: locked buttons look clearly disabled but stay clickable to explain why */
#gp .btn:not([data-free]){background:var(--color-brand-line)!important;color:var(--color-text-body)!important;border:1px dashed var(--color-control-border)!important;box-shadow:none!important;cursor:not-allowed}
#gp .btn:not([data-free]):hover{background:var(--color-border-strong)!important}
#gp .btn:not([data-free])::before{content:'';flex:none;width:1rem;height:1rem;background:currentColor;-webkit-mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/></svg>") center/contain no-repeat;mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/></svg>") center/contain no-repeat}
#gp aside{top:5rem!important}

/* ---------- surfaces ---------- */
.card{background:var(--color-surface);border:var(--bw) solid var(--color-border);border-radius:var(--r-lg);box-shadow:var(--sh-1)}
main .card.p-6{padding:1.25rem}main .card.p-5{padding:1rem 1.125rem}main .card.p-4{padding:.875rem 1rem}
main .card h2.text-sm,main .card h2.text-base{font-size:var(--fs-md);font-weight:var(--fw-semibold)}
.card.is-link{cursor:pointer;transition:border-color var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.card.is-link:hover{border-color:var(--color-brand);box-shadow:var(--sh-2)}
.dlg{background:var(--color-surface);border:var(--bw) solid var(--color-border);border-radius:var(--r-xl);box-shadow:var(--sh-3);padding:1.5rem;max-height:calc(100vh - 2rem);max-height:calc(100dvh - 2rem);overflow-y:auto;width:100%}
.drw{background:var(--color-surface);height:100%;overflow-y:auto;padding:1.5rem;width:100%;box-shadow:var(--sh-3);border-left:var(--bw) solid var(--color-border)}
.scrim{background:rgba(28,37,44,.5)}
.empty{border:1px dashed var(--color-border-strong);border-radius:var(--r-lg);background:var(--color-surface);padding:2rem 1.25rem;text-align:center;color:var(--color-text-secondary);font-size:var(--fs-sm)}

/* ---------- form controls ---------- */
.inp{width:100%;background:var(--color-surface);color:var(--color-text-primary);border:var(--bw) solid var(--color-control-border);border-radius:var(--r-md);padding:.6rem .9rem;font-size:var(--fs-sm);line-height:1.4;outline:none;transition:border-color var(--dur) var(--ease),box-shadow var(--dur) var(--ease),background-color var(--dur) var(--ease)}
.inp:hover{border-color:var(--color-text-muted)}
.inp:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px var(--color-focus-ring-soft)}
.inp:disabled{background:var(--color-page-bg);color:var(--color-text-muted);cursor:not-allowed;border-color:var(--color-border-strong)}
.inp[aria-invalid=true]{border-color:var(--color-danger);box-shadow:0 0 0 3px var(--color-danger-bg)}
select.inp{appearance:none;-webkit-appearance:none;padding-right:2.25rem;cursor:pointer;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235F6E7B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>");background-repeat:no-repeat;background-position:right .7rem center;background-size:1rem}
input[type=file].inp{padding:.4rem .6rem}
input[type=range]{accent-color:var(--color-primary);width:100%}
input[type=checkbox],input[type=radio]{accent-color:var(--color-primary)}
.tg{position:relative;width:2.75rem;height:1.5rem;background:var(--color-control-border);border-radius:9999px;transition:background-color .2s var(--ease);flex-shrink:0}
.tg:after{content:'';position:absolute;top:2px;left:2px;width:1.25rem;height:1.25rem;background:#fff;border-radius:9999px;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .2s var(--ease)}
input:checked+.tg{background:var(--color-primary)}input:checked+.tg:after{transform:translateX(1.25rem)}
input:focus-visible+.tg{outline:2px solid var(--color-focus-ring);outline-offset:2px}

/* ---------- navigation ---------- */
.nav{display:flex;align-items:center;gap:.75rem;width:100%;padding:.55rem .75rem;border-radius:var(--r-md);font-weight:var(--fw-medium);font-size:var(--fs-sm);color:var(--color-text-secondary);transition:background-color var(--dur) var(--ease),color var(--dur) var(--ease);text-align:left}
.nav svg{color:var(--color-icon-muted);transition:color var(--dur) var(--ease)}
.nav:hover{background:var(--color-page-bg);color:var(--color-text-primary)}.nav:hover svg{color:var(--color-text-secondary)}
.nav.on{background:var(--color-brand-soft);color:var(--color-primary-active);font-weight:var(--fw-semibold)}.nav.on svg{color:var(--color-primary)}
.tn{display:inline-flex;align-items:center;gap:.25rem;padding:.5rem .8rem;border-radius:var(--r-md);font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--color-text-secondary);transition:background-color var(--dur) var(--ease),color var(--dur) var(--ease);white-space:nowrap}
.tn:hover{background:var(--color-page-bg);color:var(--color-text-primary)}.tn.on{background:var(--color-brand-soft);color:var(--color-primary-active);font-weight:var(--fw-semibold)}
.tdtab{display:flex;align-items:center;gap:.4rem;padding:.6rem .9rem;font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--color-text-secondary);border-bottom:2px solid transparent;white-space:nowrap;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}
.tdtab:hover{color:var(--color-text-primary);background:var(--color-page-bg)}.tdtab[aria-selected=true]{color:var(--color-primary-active);border-color:var(--color-primary);font-weight:var(--fw-semibold)}
.chip{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .85rem;border-radius:var(--r-md);border:var(--bw) solid transparent;font-size:.8125rem;font-weight:var(--fw-semibold);color:var(--color-text-secondary);white-space:nowrap;transition:background-color var(--dur) var(--ease),color var(--dur) var(--ease),border-color var(--dur) var(--ease)}
.chip:hover{background:var(--color-page-bg);color:var(--color-text-primary)}
.chip.on,.chip[aria-pressed=true],.chip[aria-selected=true]{background:var(--color-brand-soft);color:var(--color-primary-active);border-color:var(--color-brand-line)}
.chip.line{background:var(--color-surface);border-color:var(--color-border-strong)}.chip.line:hover{border-color:var(--color-brand)}
.seg{display:inline-flex;gap:.125rem;background:var(--color-page-bg);border:var(--bw) solid var(--color-border);border-radius:var(--r-md);padding:.2rem}
.seg>button{padding:.35rem .9rem;border-radius:calc(var(--r-md) - 3px);font-size:.8125rem;font-weight:var(--fw-semibold);color:var(--color-text-secondary);transition:background-color var(--dur) var(--ease),color var(--dur) var(--ease)}
.seg>button:hover{color:var(--color-text-primary)}
.seg>button.on,.seg>button[aria-pressed=true]{background:var(--color-surface);color:var(--color-primary-active);box-shadow:var(--sh-1)}
aside.sb{width:15rem;background:var(--color-sidebar);transition:width .25s var(--ease),padding .25s var(--ease)}
aside.sb.sbc{width:4.25rem;padding-left:.5rem;padding-right:.5rem}
aside.sb.sbc .sbl{display:none}
aside.sb.sbc .nav{justify-content:center;padding:.6rem 0}
.sbt{display:flex;align-items:center;justify-content:space-between;padding:.4rem .75rem;border-radius:var(--r-md);color:var(--color-text-muted);margin-bottom:.25rem}.sbt:hover{background:var(--color-page-bg);color:var(--color-text-primary)}
.sbt svg{transition:transform .25s}aside.sb.sbc .sbt{justify-content:center;padding:.4rem 0}aside.sb.sbc .sbt svg{transform:rotate(180deg)}
.logo-mark{display:inline-flex;align-items:center;justify-content:center;background:var(--color-primary);color:#fff;border-radius:var(--r-sm);font-weight:800;font-size:.75rem;line-height:1;padding:.35rem .4rem;letter-spacing:.02em}

/* ---------- badges & status ---------- */
.bdg{display:inline-flex;align-items:center;gap:.25rem;padding:.125rem .55rem;border-radius:.4rem;font-size:var(--fs-xs);font-weight:var(--fw-semibold);line-height:1.4;white-space:nowrap;border:var(--bw) solid transparent}
.bdg-blue{background:var(--color-brand-soft);color:var(--color-primary-active);border-color:var(--color-brand-line)}
.bdg-purple,.bdg-indigo,.bdg-sky{background:var(--color-info-bg);color:var(--color-info);border-color:var(--color-info-line)}
.bdg-green{background:var(--color-success-bg);color:var(--color-success);border-color:var(--color-success-line)}
.bdg-orange,.bdg-amber{background:var(--color-warning-bg);color:var(--color-warning);border-color:var(--color-warning-line)}
.bdg-red{background:var(--color-danger-bg);color:var(--color-danger);border-color:var(--color-danger-line)}
.bdg-slate{background:var(--color-page-bg);color:var(--color-text-body);border-color:var(--color-border)}
.dot{width:2rem;height:2rem;border-radius:9999px;background:#fff;font-size:.75rem;font-weight:600;color:var(--color-text-secondary);border:1px solid var(--color-border-strong)}
.dot.done{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}
.mcard{display:flex;align-items:center;gap:.9rem;padding:1.1rem 1.25rem;border-radius:var(--r-lg);border:var(--bw) solid var(--mc-line);background:var(--mc-bg);box-shadow:var(--sh-1)}
.mcard .mi{width:2.75rem;height:2.75rem;border-radius:var(--r-md);background:var(--mc-icon-bg);color:var(--mc-icon-fg);display:flex;align-items:center;justify-content:center;flex:none}
.mcard .mn{font-size:1.75rem;line-height:1.15;font-weight:800;color:var(--mc-num);letter-spacing:-.02em}
.mcard .ml{font-size:var(--fs-sm);font-weight:var(--fw-semibold);color:var(--mc-label)}
.mcard .ms{font-size:var(--fs-xs);color:var(--mc-sub)}
.mc-students{--mc-bg:var(--mc-students-bg);--mc-line:var(--mc-students-line);--mc-icon-bg:var(--mc-students-icon-bg);--mc-icon-fg:var(--mc-students-icon-fg);--mc-num:var(--mc-students-num);--mc-label:var(--mc-students-label);--mc-sub:var(--mc-students-sub)}
.mc-teachers{--mc-bg:var(--mc-teachers-bg);--mc-line:var(--mc-teachers-line);--mc-icon-bg:var(--mc-teachers-icon-bg);--mc-icon-fg:var(--mc-teachers-icon-fg);--mc-num:var(--mc-teachers-num);--mc-label:var(--mc-teachers-label);--mc-sub:var(--mc-teachers-sub)}
.mc-queue{--mc-bg:var(--mc-queue-bg);--mc-line:var(--mc-queue-line);--mc-icon-bg:var(--mc-queue-icon-bg);--mc-icon-fg:var(--mc-queue-icon-fg);--mc-num:var(--mc-queue-num);--mc-label:var(--mc-queue-label);--mc-sub:var(--mc-queue-sub)}

/* ---------- practice grid + cards (exactly 3 columns with filters open, 4 when collapsed, on wide desktops) ---------- */
.cgrid{display:grid;gap:1.25rem;align-content:start;grid-template-columns:minmax(0,1fr)}
@media(min-width:640px){.cgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1024px){.lib-wrap[data-fc="1"] .cgrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:1280px){.lib-wrap .cgrid{grid-template-columns:repeat(3,minmax(0,1fr))}.lib-wrap[data-fc="1"] .cgrid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.cgrid>.hidden{display:none}
.pc{container-type:inline-size;display:flex;flex-direction:column;gap:.75rem;min-width:0;padding:1.125rem;background:var(--color-surface);border:var(--bw) solid var(--color-border);border-radius:var(--r-lg);box-shadow:var(--sh-1);transition:border-color var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.pc:hover,.pc:focus-within{border-color:var(--color-brand);box-shadow:var(--sh-2)}
.pc-top{display:flex;align-items:center;gap:.6rem}
.pc-ico{width:2.25rem;height:2.25rem;border-radius:var(--r-md);background:var(--color-brand-soft);color:var(--color-primary-active);display:flex;align-items:center;justify-content:center;flex:none}
.pc-tag{font-size:var(--fs-xs);font-weight:var(--fw-semibold);color:var(--color-text-secondary)}
.pc h3{font-size:var(--fs-md);font-weight:var(--fw-bold);line-height:1.35;color:var(--color-text-primary)}
.pc-d{font-size:var(--fs-sm);color:var(--color-text-secondary);line-height:1.5}
.pc-meta{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .9rem;font-size:var(--fs-xs);font-weight:var(--fw-medium);color:var(--color-text-secondary)}
.pc-foot{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem;margin-top:auto;padding-top:.25rem}
.pc-foot .btn{white-space:nowrap;padding-left:.8rem;padding-right:.8rem}
@container (max-width:250px){.pc-foot{grid-template-columns:minmax(0,1fr)}}
.mrow{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1rem;padding:1rem 1.25rem;background:var(--color-surface);border-bottom:var(--bw) solid var(--color-border)}
.mrow:last-child{border-bottom:0}
.mrow .mt{min-width:0;flex:1 1 18rem}

/* ---------- filter panel (collapsible) ---------- */
aside.fa{transition:width .25s var(--ease),padding .25s var(--ease);overflow:hidden}
aside.fa.fcl>*:not(:first-child){display:none}
@media(min-width:1024px){aside.fa.fcl{width:2.75rem!important;padding:.6rem .5rem!important}aside.fa.fcl>:first-child{flex-direction:column;gap:.5rem;border:0;margin:0;padding:0}aside.fa.fcl .fclr,aside.fa.fcl .ftx{display:none}}

/* ---------- question-type analytics (Listening / Reading results) ---------- */
.qgrp{padding:1rem 1.25rem;border-bottom:var(--bw) solid var(--color-border)}.qgrp:last-child{border-bottom:0}
.qbd{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:.2rem;min-width:2.6rem;height:2.25rem;padding:0 .55rem;border-radius:var(--r-md);border:1.5px solid var(--color-border-strong);background:var(--color-surface);color:var(--color-text-secondary);font-size:.8125rem;font-weight:var(--fw-bold);cursor:pointer;transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.qbd:hover{transform:translateY(-1px);box-shadow:var(--sh-2)}
.qbd svg{width:.8rem;height:.8rem}
.qbd.ok{background:var(--color-success-bg);border-color:#4FB070;color:var(--color-success)}
.qbd.bad{background:var(--color-danger-bg);border-color:#E0766C;color:var(--color-danger)}
.qbd.skip{background:var(--color-surface);border-color:var(--color-border-strong);border-style:dashed;color:var(--color-text-secondary)}
.qst{display:inline-flex;align-items:center;gap:.35rem;padding:.2rem .6rem;border-radius:9999px;font-size:var(--fs-xs);font-weight:var(--fw-bold)}
.qst.ok{background:var(--color-success-bg);color:var(--color-success)}.qst.bad{background:var(--color-danger-bg);color:var(--color-danger)}.qst.skip{background:var(--color-page-bg);color:var(--color-text-secondary);border:1px dashed var(--color-border-strong)}

/* ---------- Volunteer dashboard / grading ---------- */
.gbar{position:sticky;top:0;z-index:20;height:3.25rem;display:flex;align-items:center;gap:.75rem;padding:0 .75rem;background:rgba(255,255,255,.96);backdrop-filter:blur(6px);border:var(--bw) solid var(--color-border);border-radius:var(--r-lg);box-shadow:var(--sh-1)}
.gfoot{position:sticky;bottom:0;z-index:20;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;padding:.7rem 1rem;background:rgba(255,255,255,.96);backdrop-filter:blur(6px);border:var(--bw) solid var(--color-border);border-radius:var(--r-lg);box-shadow:0 -6px 20px -12px rgba(28,37,44,.2)}

/* ---------- IELTS computer-delivered exam room ---------- */
mark.hl{background:#fde047;color:var(--color-text-primary);border-radius:2px;cursor:pointer;padding:0 1px}mark.hl[data-c=g]{background:#86efac}mark.hl[data-c=b]{background:#93c5fd}mark.hl[data-c=p]{background:#f9a8d4}mark.hl[data-n]{border-bottom:2px dashed #92400e}mark.hl[data-n]::after{content:'✎';font-size:.75em;margin-left:2px;color:#92400e}
.exq{background:var(--color-surface);border:var(--bw) solid var(--color-border);border-radius:var(--r-lg);padding:1rem;margin-bottom:.75rem;transition:box-shadow .2s,border-color .2s}
.exq.flash{border-color:var(--color-primary);box-shadow:0 0 0 3px var(--color-focus-ring-soft)}
.exn{flex:none;width:1.75rem;height:1.75rem;border-radius:9999px;background:var(--color-ink);color:#fff;font-size:.8rem;font-weight:700;display:flex;align-items:center;justify-content:center}
.exfl{flex:none;padding:.35rem;border-radius:var(--r-sm);color:var(--color-text-secondary);border:1px solid transparent}.exfl:hover{background:var(--color-brand-soft)}.exfl.on{background:#fef3c7;color:#92400e;border-color:#fcd34d}
.exopt span{display:inline-block;padding:.4rem .9rem;border:var(--bw) solid var(--color-control-border);border-radius:var(--r-md);font-size:.8125rem;font-weight:600;cursor:pointer;background:var(--color-surface);transition:background-color var(--dur)}
.exopt span:hover{background:var(--color-brand-softer)}.exopt input:checked+span{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}.exopt input:focus-visible+span{outline:2px solid var(--color-primary);outline-offset:2px}
.exmc{display:flex;gap:.6rem;align-items:flex-start;padding:.55rem .75rem;border:var(--bw) solid var(--color-border-strong);border-radius:var(--r-md);cursor:pointer;font-size:.92em;background:var(--color-surface);transition:background-color var(--dur),border-color var(--dur)}
.exmc:hover{background:var(--color-brand-softer)}.exmc:has(input:checked){background:var(--color-brand-soft);border-color:var(--color-primary)}.exmc:has(input:focus-visible){outline:2px solid var(--color-primary);outline-offset:2px}
.exmc b{width:1.4rem;height:1.4rem;flex:none;border-radius:9999px;border:1px solid var(--color-text-muted);font-size:.75rem;display:flex;align-items:center;justify-content:center}
.exmc:has(input:checked) b{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}
.exfill{border:0;border-bottom:2px solid var(--color-text-muted);background:var(--color-brand-softer);padding:.1rem .5rem;width:9rem;max-width:100%;outline:none;border-radius:.25rem .25rem 0 0;font-weight:600;color:var(--color-text-primary)}
.exfill:focus{border-color:var(--color-primary);background:var(--color-brand-soft)}
.exb{min-width:2rem;height:2rem;border-radius:var(--r-sm);font-size:.75rem;font-weight:700;border:var(--bw) solid var(--color-border-strong);background:var(--color-page-bg);color:var(--color-text-body);position:relative;flex:none;transition:background-color .12s}
.exb:hover{background:var(--color-brand-line)}.exb.ans{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}.exb.ans:hover{background:var(--color-primary-hover)}
.exb.flg::after{content:'';position:absolute;top:-5px;right:-5px;width:11px;height:11px;border-radius:9999px;background:#f59e0b;border:2px solid #fff}
.exb.cur{outline:2px solid var(--color-ink);outline-offset:2px}
.exp{display:flex;align-items:center;gap:.5rem;padding:.4rem .5rem;border-radius:var(--r-md);border:1px solid transparent;flex:none}.exp.act{background:var(--color-brand-softer);border-color:var(--color-brand-line)}
.exa{padding:.25rem .6rem;border:var(--bw) solid var(--color-border-strong);border-radius:var(--r-sm);font-size:.8rem;font-weight:700;color:var(--color-text-body);background:var(--color-surface)}.exa:hover{background:var(--color-brand-softer)}

/* ---------- misc ---------- */
@keyframes twk{0%,100%{opacity:1;transform:scale(1);filter:drop-shadow(0 0 0 rgba(252,211,77,0))}50%{opacity:.8;transform:scale(1.18);filter:drop-shadow(0 0 6px rgba(252,211,77,.9))}}
.twk{animation:twk 2.4s ease-in-out infinite}
main .grid>*{min-width:0}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}

/* ---------- Admin: simulated certificate document ---------- */
.cert{position:relative;overflow:hidden;background:#fff;border:1px solid var(--color-border-strong);border-radius:var(--r-md);padding:1.75rem 1.5rem;box-shadow:inset 0 0 0 6px var(--color-brand-softer),inset 0 0 0 7px var(--color-brand-line)}
.cert::after{content:'DEMO';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:6.5rem;font-weight:800;letter-spacing:.08em;color:var(--color-text-primary);opacity:.05;transform:rotate(-22deg);pointer-events:none}

/* BandUp v1.1 implementation alignment */
body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--color-canvas);color:var(--color-text-secondary)}
h1,h2,h3,h4,h5,h6,.serif,main h1,main h2,main h3,main h4{font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--color-text-primary)}
.serif{font-weight:700}
.inp{min-height:44px;background:#FFFFFF;border-color:#8E9290;color:#112A1E}
.btn{min-height:44px}
.btn.ico{min-height:44px}
aside.sb{width:256px}
aside.sb.sbc{width:68px}
.card{border-color:#E2E8E5}
.logo-mark{background:#165136;color:#FFFFFF}
.nav.on,.tn.on,.chip.on,.chip[aria-pressed=true]{background:#E6F4EC;color:#165136}
.b1{background:#165136;color:#FFFFFF}
.b1:hover,.b1:active{background:#165136}
.b3{background:#E6F4EC;color:#165136;border-color:#E2E8E5}
.b4:hover{background:#E6F4EC;border-color:#165136;color:#165136}
/* Make every focusable target practical on touch while retaining compact controls in dense tables. */
button,a,[role=button]{scroll-margin:8px}
@media(max-width:639px){.btn{min-height:44px}main .card.p-6{padding:1rem}}
@media(prefers-color-scheme:dark){
 :root{color-scheme:dark;--color-canvas:#091710;--color-page-bg:#091710;--color-surface:#112A1E;--color-surface-2:#163828;--color-surface-elevated:#163828;--color-sidebar:#112A1E;--color-brand:#5BB583;--color-primary:#5BB583;--color-primary-hover:#5BB583;--color-primary-active:#5BB583;--color-brand-soft:#163828;--color-brand-softer:#163828;--color-brand-line:#165136;--color-secondary:#288253;--color-secondary-strong:#288253;--color-secondary-soft:rgba(56,189,248,.15);--color-border:#165136;--color-border-strong:#288253;--color-control-border:#288253;--color-icon-muted:#E6F4EC;--color-text-primary:#FFFFFF;--color-text-strong:#FFFFFF;--color-text-body:#E6F4EC;--color-text-secondary:#E6F4EC;--color-text-muted:#E6F4EC;--color-ink:#FFFFFF;--color-focus-ring:#5BB583;--color-focus-ring-soft:rgba(91,181,131,.2);--color-success:#5BB583;--color-success-bg:rgba(91,181,131,.16);--color-success-line:rgba(91,181,131,.35);--color-warning:#FBBF24;--color-warning-bg:rgba(251,191,36,.15);--color-warning-line:rgba(251,191,36,.35);--color-danger:#FCA5A5;--color-danger-bg:rgba(248,113,113,.16);--color-danger-line:rgba(248,113,113,.35);--color-info:#38BDF8;--color-info-bg:rgba(56,189,248,.15);--color-info-line:rgba(56,189,248,.32);--color-disabled-bg:rgba(230,244,236,.08);--color-disabled-text:#94A89E;--chart-grid:#165136;--chart-axis:#E6F4EC;--blue-50:22 56 40;--blue-100:22 56 40;--blue-200:22 81 54;--blue-300:91 181 131;--blue-400:91 181 131;--blue-500:91 181 131;--blue-600:91 181 131;--blue-700:91 181 131;--blue-800:230 244 236;--blue-900:255 255 255;--blue-950:9 23 16;--slate-50:9 23 16;--slate-100:22 56 40;--slate-200:22 81 54;--slate-300:40 130 83;--slate-400:230 244 236;--slate-500:230 244 236;--slate-600:230 244 236;--slate-700:230 244 236;--slate-800:255 255 255;--slate-900:255 255 255}
 body{background:#091710;color:#E6F4EC}
 .bg-white{background-color:#112A1E!important}
 .bg-slate-50,.bg-slate-100,.bg-gray-50,.bg-gray-100{background-color:#163828!important}
 .text-slate-900,.text-slate-800,.text-slate-700,.text-slate-600,.text-slate-500{color:#E6F4EC!important}
 .border-slate-100,.border-slate-200,.border-slate-300{border-color:#165136!important}
 .card,.dlg,.drw{background:#112A1E;border-color:#165136;color:#E6F4EC}
 .inp{background:#112A1E;color:#FFFFFF;border-color:#288253}
 .b1{background:#5BB583;color:#112A1E}.b1:hover,.b1:active{background:#5BB583}
 .b3{background:#163828;color:#E6F4EC;border-color:#165136}
 .b4{background:#112A1E;color:#E6F4EC;border-color:#288253}
 .btn:disabled{background:rgba(230,244,236,.08);color:#94A89E;border-color:rgba(230,244,236,.15)}
 .nav,.tn{color:#E6F4EC}.nav.on,.tn.on,.chip.on{background:#163828;color:#5BB583}
 .scrim{background:rgba(9,23,16,.72)}
}


/* ===== BandUp v10 UI refinement: user-approved navigation, card and heading rules ===== */
.page-intro{display:none!important}
.welcome-head:not(.home-page-heading){display:none!important}
.home-page-heading{display:block!important}
.card,.pc{background:var(--color-surface)!important}
.card,.pc{border-color:var(--color-border)!important}
.mcard{background:var(--mc-bg)!important;border-color:var(--mc-line)!important}
.pc{padding:0!important;overflow:hidden;gap:0!important;min-height:330px!important}
.pc:hover,.pc:focus-within{border-color:#5BB583!important;box-shadow:0 8px 24px -10px rgba(17,42,30,.16)!important}
.pc-visual{height:104px;min-height:104px;background-position:center;background-size:cover;display:flex;align-items:flex-end;padding:12px 16px;color:#fff;font:600 13px Inter,system-ui,sans-serif;letter-spacing:.02em}
.pc-visual span{background:rgba(17,42,30,.72);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:4px 10px}
.pc-body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;min-height:226px}
.pc-body-top{display:flex;align-items:center;gap:8px;min-height:20px;margin-bottom:8px}
.pc-body h3{font-family:'Plus Jakarta Sans',Inter,sans-serif;font-size:16px;line-height:1.35;font-weight:700;color:var(--color-text-primary);margin-bottom:6px}
.pc-body .pc-d{font:400 14px/1.5 Inter,system-ui,sans-serif;color:var(--color-text-secondary);min-height:42px}
.pc-body .pc-meta{margin-top:10px;min-height:22px}
.pc-foot.v10-card-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:auto;padding-top:14px}
.pc-foot.v10-card-actions .btn{min-width:104px;min-height:40px}
.tn{position:relative;text-decoration:none!important;color:#4A5D54;transition:color .16s ease}
.tn::after{content:'';position:absolute;left:.8rem;right:.8rem;bottom:3px;height:2px;background:#165136;transform:scaleX(0);transform-origin:left;transition:transform .16s ease}
.tn:hover,.tn.on{color:#165136!important;font-weight:700;text-decoration:none!important}
.tn:hover::after,.tn.on::after{transform:scaleX(1)}
.dash-stat{display:flex;align-items:center;gap:14px;padding:18px 20px;border:1px solid var(--color-border);border-radius:12px;background:var(--color-surface);box-shadow:0 1px 2px rgba(17,42,30,.04);min-height:108px}
.dash-stat-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--color-brand-soft);color:var(--color-primary);flex:none}
.dash-stat p{font:500 13px/1.35 Inter,sans-serif;color:var(--color-text-secondary)}
.dash-stat strong{display:block;font:700 25px/1.25 'Plus Jakarta Sans',sans-serif;color:var(--color-text-primary);margin:2px 0}
.dash-stat small{display:block;font:400 12px/1.4 Inter,sans-serif;color:var(--color-text-secondary)}
@media(max-width:767px){.pc{min-height:316px!important}.pc-visual{height:96px;min-height:96px}.pc-body{min-height:220px;padding:14px}.pc-foot.v10-card-actions .btn{min-width:94px}}


@media(prefers-color-scheme:dark){
  .card,.pc{background:var(--color-surface)!important;border-color:var(--color-border)!important}
  .mcard{border-color:var(--mc-line)!important}
  :root{
    --mc-students-bg:#163828;--mc-students-line:#165136;--mc-students-icon-bg:#5BB583;--mc-students-icon-fg:#112A1E;--mc-students-num:#FFFFFF;--mc-students-label:#E6F4EC;--mc-students-sub:#E6F4EC;
    --mc-teachers-bg:#163828;--mc-teachers-line:#165136;--mc-teachers-icon-bg:#288253;--mc-teachers-icon-fg:#FFFFFF;--mc-teachers-num:#FFFFFF;--mc-teachers-label:#38BDF8;--mc-teachers-sub:#E6F4EC;
    --mc-queue-bg:#112A1E;--mc-queue-line:#165136;--mc-queue-icon-bg:#5BB583;--mc-queue-icon-fg:#112A1E;--mc-queue-num:#FFFFFF;--mc-queue-label:#E6F4EC;--mc-queue-sub:#E6F4EC;
  }
}
```

## `src/styles/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## `src/styles/tokens.css`

```css
/* Design tokens extracted from BandUp IELTS Prototype v10. */
:root{
  --color-canvas:#F7F7F7;
  --color-page-bg:#F7F7F7;
  --color-surface:#FFFFFF;
  --color-surface-2:#E6F4EC;
  --color-surface-elevated:#FFFFFF;
  --color-sidebar:#FFFFFF;
  --color-brand:#5BB583;
  --color-primary:#165136;
  --color-primary-hover:#165136;
  --color-primary-active:#165136;
  --color-brand-soft:#E6F4EC;
  --color-brand-softer:#E6F4EC;
  --color-brand-line:#E2E8E5;
  --color-secondary:#288253;
  --color-secondary-strong:#288253;
  --color-secondary-soft:#E0F2FE;
  --color-accent:var(--color-secondary);
  --color-border:#E2E8E5;
  --color-border-strong:#8E9290;
  --color-control-border:#8E9290;
  --color-icon-muted:#4A5D54;
  --color-text-primary:#112A1E;
  --color-text-strong:#112A1E;
  --color-text-body:#4A5D54;
  --color-text-secondary:#4A5D54;
  --color-text-muted:#4A5D54;
  --color-ink:#112A1E;
  --color-focus-ring:#165136;
  --color-focus-ring-soft:rgba(91,181,131,.28);
  --color-success:#165136;--color-success-bg:#E6F4EC;--color-success-line:#E2E8E5;
  --color-warning:#9A4707;--color-warning-bg:#FEF6E6;--color-warning-line:#FEF6E6;
  --color-danger:#B91C1C;--color-danger-bg:#FDECEC;--color-danger-line:#FDECEC;
  --color-info:#0369A1;--color-info-bg:#E0F2FE;--color-info-line:#E0F2FE;
  --color-disabled-bg:#E5E7EB;--color-disabled-text:#525866;
  --mc-students-bg:#E6F4EC;--mc-students-line:#E2E8E5;--mc-students-icon-bg:#5BB583;--mc-students-icon-fg:#112A1E;--mc-students-num:#112A1E;--mc-students-label:#165136;--mc-students-sub:#4A5D54;
  --mc-teachers-bg:#E0F2FE;--mc-teachers-line:#E0F2FE;--mc-teachers-icon-bg:#288253;--mc-teachers-icon-fg:#FFFFFF;--mc-teachers-num:#112A1E;--mc-teachers-label:#0369A1;--mc-teachers-sub:#4A5D54;
  --mc-queue-bg:#165136;--mc-queue-line:#165136;--mc-queue-icon-bg:#5BB583;--mc-queue-icon-fg:#112A1E;--mc-queue-num:#FFFFFF;--mc-queue-label:#E6F4EC;--mc-queue-sub:#E6F4EC;
  --chart-1:#5BB583;--chart-2:#288253;--chart-3:#165136;--chart-4:#E6F4EC;--chart-grid:#E2E8E5;--chart-axis:#4A5D54;
  --r-sm:6px;--r-md:8px;--r-lg:12px;--r-xl:16px;
  --bw:1px;
  --sh-1:0 1px 2px rgba(17,42,30,.05);
  --sh-2:0 8px 24px -10px rgba(17,42,30,.14);
  --sh-3:0 28px 56px -18px rgba(17,42,30,.28);
  --fs-xs:12px;--fs-sm:14px;--fs-md:15px;
  --fw-medium:500;--fw-semibold:600;--fw-bold:700;
  --h-ctl:44px;--h-ctl-sm:32px;
  --pad-card:20px;
  --dur:180ms;--ease:cubic-bezier(.2,.7,.2,1);
  /* Tailwind palette aliases use only official semantic token values. */
  --blue-50:230 244 236;--blue-100:230 244 236;--blue-200:226 232 229;--blue-300:91 181 131;--blue-400:40 130 83;--blue-500:40 130 83;--blue-600:22 81 54;--blue-700:22 81 54;--blue-800:22 81 54;--blue-900:17 42 30;--blue-950:9 23 16;
  --sec-50:224 242 254;--sec-100:224 242 254;--sec-200:224 242 254;--sec-300:3 105 161;--sec-400:3 105 161;--sec-500:3 105 161;--sec-600:3 105 161;--sec-700:3 105 161;--sec-800:3 105 161;--sec-900:3 105 161;--sec-950:3 105 161;
  --ok-50:230 244 236;--ok-100:230 244 236;--ok-200:226 232 229;--ok-300:91 181 131;--ok-400:91 181 131;--ok-500:22 81 54;--ok-600:22 81 54;--ok-700:22 81 54;--ok-800:22 81 54;--ok-900:17 42 30;
  --slate-50:247 247 247;--slate-100:230 244 236;--slate-200:226 232 229;--slate-300:142 146 144;--slate-400:74 93 84;--slate-500:74 93 84;--slate-600:74 93 84;--slate-700:17 42 30;--slate-800:17 42 30;--slate-900:17 42 30;
}
```

## `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

## `src/types/common.ts`

```ts
export type AppRole = 'student' | 'teacher' | 'admin';

export type Skill = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

export type ThemeMode = 'light' | 'dark' | 'system';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BaseEntity {
  id: string;
  createdAt?: number;
  updatedAt?: number;
}
```

## `src/types/navigation.ts`

```ts
import type { AppRole } from './common';

export type IconName =
  | 'home'
  | 'headphones'
  | 'book-open'
  | 'pen-line'
  | 'mic'
  | 'layers'
  | 'message-circle'
  | 'file-check'
  | 'clock'
  | 'users'
  | 'user'
  | 'shield-check'
  | 'database'
  | 'bell'
  | 'settings'
  | 'help-circle'
  | 'menu'
  | 'x'
  | 'chevron-down'
  | 'chevron-left'
  | 'log-out'
  | 'search'
  | 'calendar'
  | 'chart'
  | 'clipboard-list'
  | 'file-text'
  | 'sliders'
  | 'book-marked'
  | 'sparkles'
  | 'arrow-right'
  | 'external-link'
  | 'info'
  | 'check'
  | 'alert-circle'
  | 'plus';

export interface NavigationItem {
  label: string;
  to: string;
  icon?: IconName;
  end?: boolean;
}

export interface RoleNavigation {
  role: AppRole;
  label: string;
  basePath: string;
  items: NavigationItem[];
}
```

## `tailwind.config.cjs`

```js
const withOpacity = (variable) => `rgb(var(--${variable}) / <alpha-value>)`;

const palette = (prefix, include950 = true) => ({
  50: withOpacity(`${prefix}-50`),
  100: withOpacity(`${prefix}-100`),
  200: withOpacity(`${prefix}-200`),
  300: withOpacity(`${prefix}-300`),
  400: withOpacity(`${prefix}-400`),
  500: withOpacity(`${prefix}-500`),
  600: withOpacity(`${prefix}-600`),
  700: withOpacity(`${prefix}-700`),
  800: withOpacity(`${prefix}-800`),
  900: withOpacity(`${prefix}-900`),
  ...(include950 ? { 950: withOpacity(`${prefix}-950`) } : {}),
});

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        blue: palette('blue'),
        slate: palette('slate'),
        sky: palette('sec'),
        cyan: palette('sec'),
        purple: palette('sec'),
        indigo: palette('sec'),
        violet: palette('sec'),
        emerald: palette('ok', false),
        green: palette('ok', false),
      },
    },
  },
  plugins: [],
};
```

## `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

## `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

## `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
});
```

## `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    clearMocks: true,
  },
});
```
