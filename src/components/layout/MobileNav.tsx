import { NavLink } from 'react-router-dom';
import { PUBLIC_PRACTICE_ITEMS, ROLE_BASE_PATH, ROLE_LABELS, ROLE_NAVIGATION } from '../../data/navigation';
import type { AppRole } from '../../types/common';
import { Icon } from '../ui/Icon';

export interface MobileNavProps {
  role: AppRole;
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ role, open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="mobile-nav-layer">
      <button type="button" className="mobile-nav-backdrop" onClick={onClose} aria-label="Close navigation" />
      <aside className="mobile-nav-panel" aria-label={`${ROLE_LABELS[role]} mobile navigation`}>
        <div className="mobile-nav-heading-row">
          <NavLink to={ROLE_BASE_PATH[role]} className="brand-lockup" onClick={onClose}>
            <span className="logo-mark">BU</span>
            <span>BandUp IELTS</span>
          </NavLink>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close navigation">
            <Icon name="x" />
          </button>
        </div>
        <nav className="mobile-app-nav">
          {role === 'student' ? (
            <>
              {ROLE_NAVIGATION[role].slice(0, 1).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`} onClick={onClose}>
                  {item.icon ? <Icon name={item.icon} size={19} /> : null}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <p className="mobile-nav-heading">Practice</p>
              {PUBLIC_PRACTICE_ITEMS.map((item) => (
                <NavLink key={item.to} to={`${ROLE_BASE_PATH.student}${item.to}`} className="nav" onClick={onClose}>
                  {item.icon ? <Icon name={item.icon} size={19} /> : null}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              {ROLE_NAVIGATION[role].slice(1).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`} onClick={onClose}>
                  {item.icon ? <Icon name={item.icon} size={19} /> : null}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          ) : ROLE_NAVIGATION[role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav ${isActive ? 'on' : ''}`}
              onClick={onClose}
            >
              {item.icon ? <Icon name={item.icon} size={19} /> : null}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
