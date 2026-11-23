import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAVIGATION } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { demoUsers } from '../../services/demo/seedData';
import { NotificationMenu } from './NotificationMenu';

export interface AppSidebarProps {
  role: AppRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ role, collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { switchDemoAccount } = useAuth();
  const navigate = useNavigate();
  const [switchOpen, setSwitchOpen] = useState(false);
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
        {ROLE_NAVIGATION[role].map((item) => item.label === 'Notifications' ? <NotificationMenu key={item.to} role={role} presentation="sidebar" /> : (
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
        <div className="px-3 py-2 text-xs text-slate-600">{user?.name} · {user?.label}</div>
        <button type="button" className="nav" onClick={() => setSwitchOpen((open) => !open)} aria-expanded={switchOpen}>
          <Icon name="users" size={19} /><span className="sbl sidebar-link-label">Switch demo account</span>
        </button>
        {switchOpen ? demoUsers.filter((item) => ['s1', 'v1', 'v2', 'a1', 'sx7'].includes(item.id)).map((item) => <button key={item.id} type="button" className="nav text-xs" onClick={async () => { const result = await switchDemoAccount(item.id); if (result.ok) navigate(ROLE_BASE_PATH[result.user.role]); }}><span className="sbl sidebar-link-label">{item.name}{item.status === 'blocked' ? ' · Blocked' : ''}</span></button>) : null}
        <button type="button" className="nav" onClick={logout}>
          <Icon name="log-out" size={19} />
          <span className="sbl sidebar-link-label">Sign out</span>
        </button>
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
