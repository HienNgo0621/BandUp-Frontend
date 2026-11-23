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
