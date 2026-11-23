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
import { AboutPage, ContactPage, GuestPreviewPage, HelpCenterPage, LandingPage, LegalPage } from '../pages/PublicPages';
import { ApplicationStatusPage, ForgotPasswordPage, SignUpPage, StudentRegistrationPage, VerifyPage, VolunteerApplicationPage } from '../pages/AuthPages';

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
      element: <LandingPage />,
    },
    { path: 'about', element: <AboutPage /> },
    { path: 'volunteers', element: <Navigate to="/about" replace /> },
    { path: 'contact', element: <ContactPage /> },
    { path: 'help', element: <HelpCenterPage /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'signup', element: <SignUpPage /> },
    { path: 'forgot-password', element: <ForgotPasswordPage /> },
    { path: 'register/student', element: <StudentRegistrationPage /> },
    { path: 'verify', element: <VerifyPage /> },
    { path: 'apply', element: <VolunteerApplicationPage /> },
    { path: 'application-status', element: <ApplicationStatusPage /> },
    { path: 'practice/listening', element: <GuestPreviewPage skill="Listening" /> },
    { path: 'practice/reading', element: <GuestPreviewPage skill="Reading" /> },
    { path: 'practice/writing', element: <GuestPreviewPage skill="Writing" /> },
    { path: 'practice/speaking', element: <GuestPreviewPage skill="Speaking" /> },
    { path: 'mocks', element: <GuestPreviewPage skill="Mock Tests" /> },
    { path: 'forum', element: <GuestPreviewPage skill="Community" /> },
    { path: 'faq', element: <Navigate to="/help" replace /> },
    { path: 'privacy', element: <LegalPage kind="privacy" /> },
    { path: 'guidelines', element: <LegalPage kind="guidelines" /> },
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
