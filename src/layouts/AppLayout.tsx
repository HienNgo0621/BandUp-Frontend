import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { AppRole } from '../types/common';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';
import { MobileNav } from '../components/layout/MobileNav';

export interface AppLayoutProps {
  role: AppRole;
}

export function AppLayout({ role }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      {role === 'student' ? <AppHeader role={role} onOpenMobileNav={() => setMobileNavOpen(true)} /> : null}
      <div className="app-layout-body">
        <AppSidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
        />
        <main id="main" className="app-main">
          <div className="app-main-inner fi">
            <Outlet />
            <footer className="app-shell-footer">
              <span>© 2026 BandUp IELTS Community</span>
              <span>Learning together, one step at a time.</span>
            </footer>
          </div>
        </main>
      </div>
      <MobileNav role={role} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
