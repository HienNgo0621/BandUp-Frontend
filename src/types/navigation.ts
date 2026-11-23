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
