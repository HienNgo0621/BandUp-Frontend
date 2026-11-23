import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_BASE_PATH } from '../../data/navigation';
import { useAppData } from '../../hooks/useAppData';
import { useAuth } from '../../hooks/useAuth';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';

const LEGACY_ROUTE: Record<string, string> = {
  feedback: 'feedback', forum: 'forum', 'forum-post': 'forum', 'forum-topic': 'forum', history: 'history', notes: 'notes', plan: 'study-plan', goals: 'goals', progress: 'progress', 't-dash': '', 'a-dash': '',
};

export function NotificationMenu({ role, presentation, onNavigate }: { role: AppRole; presentation: 'header' | 'sidebar' | 'mobile'; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppData();
  const navigate = useNavigate();
  if (!user) return null;
  const visible = notifications.filter((item) => item.recipientId === user.id || item.recipientId === `all:${role}`).sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = visible.filter((item) => !item.readBy.includes(user.id)).length;
  const targetFor = (legacyRoute?: string) => legacyRoute && LEGACY_ROUTE[legacyRoute] !== undefined
    ? `${ROLE_BASE_PATH[role]}${LEGACY_ROUTE[legacyRoute] ? `/${LEGACY_ROUTE[legacyRoute]}` : ''}`
    : null;
  const openNotification = (id: string, route?: string) => {
    markNotificationRead(id, user.id);
    setOpen(false);
    const target = targetFor(route);
    if (target) { onNavigate?.(); navigate(target); }
  };
  const triggerClass = presentation === 'header' ? 'app-header-icon-button notification-trigger' : 'nav notification-trigger';
  return <div className={`notification-menu-wrap ${presentation === 'sidebar' ? 'sidebar-notification-wrap' : ''} ${presentation === 'mobile' ? 'mobile-notification-wrap' : ''}`}>
    <button type="button" className={triggerClass} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Icon name="bell" size={presentation === 'header' ? 20 : 19} />
      {presentation !== 'header' ? <span className={presentation === 'sidebar' ? 'sbl sidebar-link-label' : ''}>Notifications</span> : null}
      {unreadCount ? <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
    </button>
    {open ? <section className="notification-popover card" aria-label="Notifications">
      <div className="notification-popover-head"><div><h2>Notifications</h2><p>{unreadCount} unread · {visible.length} total</p></div><button type="button" className="text-xs font-semibold text-blue-700 hover:underline" disabled={!unreadCount} onClick={() => markAllNotificationsRead(user.id, role)}>Mark all as read</button></div>
      <div className="notification-popover-list">{visible.length ? visible.map((item) => {
        const isRead = item.readBy.includes(user.id);
        return <button key={item.id} type="button" className={`notification-item ${isRead ? 'is-read' : 'is-unread'}`} onClick={() => openNotification(item.id, item.relatedRoute)}>
          <span className="notification-status-dot" aria-label={isRead ? 'Read' : 'Unread'} />
          <span className="notification-item-copy"><span>{item.content}</span><time dateTime={new Date(item.createdAt).toISOString()}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(item.createdAt)}</time></span>
          {targetFor(item.relatedRoute) ? <Icon name="arrow-right" size={16} /> : null}
        </button>;
      }) : <p className="notification-empty">You are all caught up.</p>}</div>
    </section> : null}
  </div>;
}
