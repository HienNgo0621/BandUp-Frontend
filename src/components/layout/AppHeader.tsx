import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { PUBLIC_PRACTICE_ITEMS, ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAMES } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { NotificationMenu } from './NotificationMenu';
import { demoUsers } from '../../services/demo/seedData';
import { ROLE_BASE_PATH as ROLE_PATHS } from '../../data/navigation';

export interface AppHeaderProps {
  role: AppRole;
  onOpenMobileNav: () => void;
}

export function AppHeader({ role, onOpenMobileNav }: AppHeaderProps) {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const basePath = ROLE_BASE_PATH[role];
  const { user, logout, switchDemoAccount } = useAuth();
  const navigate = useNavigate();
  const [switchOpen, setSwitchOpen] = useState(false);

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
          <NotificationMenu role={role} presentation="header" />
          <div className="app-user-summary">
            <span className="app-user-avatar">{(user?.name ?? ROLE_NAMES[role]).split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
            <span className="app-user-copy">
              <strong>{user?.name ?? ROLE_NAMES[role]}</strong>
              <small>{user?.label ?? ROLE_LABELS[role]}</small>
            </span>
          </div>
          <button className="app-header-icon-button" type="button" aria-label="Sign out" title="Sign out" onClick={() => { logout(); navigate('/'); }}><Icon name="log-out" size={20} /></button>
          <div className="relative">
            <button className="app-header-icon-button" type="button" aria-expanded={switchOpen} onClick={() => setSwitchOpen((open) => !open)} aria-label="Switch demo account" title="Switch demo account"><Icon name="users" size={20} /></button>
            {switchOpen ? <div className="nav-dropdown card" role="menu" aria-label="Demo accounts">{demoUsers.filter((item) => ['s1', 'v1', 'v2', 'a1', 'sx7'].includes(item.id)).map((item) => <button key={item.id} type="button" className="nav-dropdown-link" role="menuitem" onClick={async () => { const result = await switchDemoAccount(item.id); if (result.ok) { setSwitchOpen(false); navigate(ROLE_PATHS[result.user.role]); } }}>{item.name}{item.status === 'blocked' ? ' · Blocked' : ''}</button>)}</div> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
