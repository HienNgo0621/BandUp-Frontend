import type { AppRole } from '../types/common';
import type { NavigationItem } from '../types/navigation';

export const PUBLIC_PRACTICE_ITEMS: NavigationItem[] = [
  { label: 'Listening', to: '/practice/listening', icon: 'headphones' },
  { label: 'Reading', to: '/practice/reading', icon: 'book-open' },
  { label: 'Writing', to: '/practice/writing', icon: 'pen-line' },
  { label: 'Speaking', to: '/practice/speaking', icon: 'mic' },
];

export const PUBLIC_ABOUT_ITEMS: NavigationItem[] = [
  { label: 'About & volunteers', to: '/about', icon: 'sparkles' },
  { label: 'Contact & feedback', to: '/contact', icon: 'user' },
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
