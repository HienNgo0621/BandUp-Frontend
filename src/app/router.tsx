import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import type { AppRole } from '../types/common';
import { ROLE_BASE_PATH, ROLE_NAVIGATION } from '../data/navigation';
import { AboutPage, ContactPage, HelpCenterPage, LandingPage } from '../pages/PublicPages';
import { ForumPage, ForumPostPage, ForumTopicPage } from '../pages/ForumGuestPages';
import { MockTestsPage, PracticeLibraryPage, SamplePreviewPage } from '../pages/GuestPracticePages';
import { ApplicationStatusPage, ForgotPasswordPage, SignUpPage, StudentRegistrationPage, VerifyPage, VolunteerApplicationPage } from '../pages/AuthPages';
import { WorkspacePage } from '../pages/WorkspacePages';

interface WorkspaceRouteDefinition { path: string; }
const STUDENT_ROUTES: WorkspaceRouteDefinition[] = ['practice/listening', 'practice/reading', 'practice/writing', 'practice/speaking', 'mocks', 'forum', 'study-plan', 'goals', 'progress', 'history', 'feedback', 'notes', 'notifications', 'account', 'settings', 'help'].map((path) => ({ path }));
const TEACHER_ROUTES: WorkspaceRouteDefinition[] = ['forum', 'grading-history', 'notifications', 'account', 'settings', 'help'].map((path) => ({ path }));
const ADMIN_ROUTES: WorkspaceRouteDefinition[] = ['forum', 'applications', 'users', 'teachers', 'moderation', 'question-bank', 'quality', 'access-control', 'help-management', 'notifications', 'settings', 'help'].map((path) => ({ path }));

function buildWorkspaceRoute(role: AppRole, routeDefinitions: WorkspaceRouteDefinition[]): RouteObject {
  return { element: <ProtectedRoute />, children: [{ element: <RoleGuard allowedRoles={[role]} />, children: [{ path: ROLE_BASE_PATH[role], element: <AppLayout role={role}/>, children: [{ index: true, element: <WorkspacePage role={role}/> }, ...routeDefinitions.map((route) => ({ path: route.path, element: <WorkspacePage role={role}/> }))] }] }] };
}

const publicRoutes: RouteObject = { path: '/', element: <PublicLayout />, children: [
  { index: true, element: <LandingPage /> }, { path: 'about', element: <AboutPage /> }, { path: 'volunteers', element: <Navigate to="/about" replace /> }, { path: 'contact', element: <ContactPage /> }, { path: 'help', element: <HelpCenterPage /> },
  { path: 'login', element: <LoginPage /> }, { path: 'signup', element: <SignUpPage /> }, { path: 'forgot-password', element: <ForgotPasswordPage /> }, { path: 'register/student', element: <StudentRegistrationPage /> }, { path: 'verify', element: <VerifyPage /> }, { path: 'apply', element: <VolunteerApplicationPage /> }, { path: 'application-status', element: <ApplicationStatusPage /> },
  { path: 'practice/listening', element: <PracticeLibraryPage skill="Listening" /> }, { path: 'practice/reading', element: <PracticeLibraryPage skill="Reading" /> }, { path: 'practice/writing', element: <PracticeLibraryPage skill="Writing" /> }, { path: 'practice/speaking', element: <PracticeLibraryPage skill="Speaking" /> }, { path: 'sample/:skill/:sampleId', element: <SamplePreviewPage /> }, { path: 'mocks', element: <MockTestsPage /> }, { path: 'forum', element: <ForumPage /> }, { path: 'forum/topic/:topicKey', element: <ForumTopicPage /> }, { path: 'forum/post/:postId', element: <ForumPostPage /> }, { path: 'faq', element: <Navigate to="/help" replace /> },
] };

export const router = createBrowserRouter([publicRoutes, buildWorkspaceRoute('student', STUDENT_ROUTES), buildWorkspaceRoute('teacher', TEACHER_ROUTES), buildWorkspaceRoute('admin', ADMIN_ROUTES), { path: '*', element: <NotFoundPage /> }]);
export const workspaceRouteCounts = { student: ROLE_NAVIGATION.student.length + STUDENT_ROUTES.length, teacher: ROLE_NAVIGATION.teacher.length + TEACHER_ROUTES.length, admin: ROLE_NAVIGATION.admin.length + ADMIN_ROUTES.length };
