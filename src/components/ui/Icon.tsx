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
  play: 'm8 5 12 7-12 7V5Z',
  pause: 'M8 5v14m8-14v14',
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
