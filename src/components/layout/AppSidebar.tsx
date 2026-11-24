import { NavLink, useNavigate } from 'react-router-dom';
import { ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAVIGATION } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { NotificationMenu } from './NotificationMenu';

export function AppSidebar({ role, collapsed, onToggle }: { role: AppRole; collapsed: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  if (role === 'student') return null;
  return <aside className={`sb app-sidebar ${collapsed ? 'sbc' : ''}`} aria-label="Workspace sidebar"><div className="sidebar-brand-row"><NavLink to={ROLE_BASE_PATH[role]} className="sidebar-brand"><span className="logo-mark">BU</span><span className="sbl">BandUp IELTS</span></NavLink></div><button type="button" className="sbt sidebar-collapse-button" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><span className="sbl sidebar-menu-label">{ROLE_LABELS[role]}</span><Icon name="chevron-left" size={17} className={collapsed ? 'sidebar-collapse-icon is-collapsed' : 'sidebar-collapse-icon'}/></button><nav className="sidebar-nav" aria-label={`${ROLE_LABELS[role]} navigation`}>{ROLE_NAVIGATION[role].map((item) => item.label === 'Notifications' ? <NotificationMenu key={item.to} role={role} presentation="sidebar"/> : <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`} title={collapsed ? item.label : undefined}>{item.icon && <Icon name={item.icon} size={19}/>}<span className="sbl sidebar-link-label">{item.label}</span></NavLink>)}</nav><div className="sidebar-bottom"><div className="px-3 py-2 text-xs text-slate-600">{user?.name} · {user?.label}</div><button type="button" className="nav" onClick={() => { logout(); navigate('/'); }}><Icon name="log-out" size={19}/><span className="sbl sidebar-link-label">Sign out</span></button><NavLink to={`${ROLE_BASE_PATH[role]}/settings`} className="nav"><Icon name="settings" size={19}/><span className="sbl sidebar-link-label">Settings</span></NavLink><NavLink to={`${ROLE_BASE_PATH[role]}/help`} className="nav"><Icon name="help-circle" size={19}/><span className="sbl sidebar-link-label">Help Center</span></NavLink></div></aside>;
}
