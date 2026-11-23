import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
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
    element: <ProtectedRoute />,
    children: [{
      element: <RoleGuard allowedRoles={[role]} />,
      children: [{
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
      }],
    }],
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
    { path: 'about', ...placeholder('About & volunteers', 'Learn about the BandUp IELTS community, its mission and volunteer contributors.') },
    { path: 'volunteers', element: <Navigate to="/about" replace /> },
    { path: 'contact', ...placeholder('Contact & feedback', 'Get in touch with the BandUp IELTS community.') },
    { path: 'help', ...placeholder('Help Center', 'Search help articles and product guidance.') },
    { path: 'login', element: <LoginPage /> },
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
