import { Outlet } from 'react-router-dom';
import { PublicFooter } from '../components/layout/PublicFooter';
import { PublicHeader } from '../components/layout/PublicHeader';
import { GuestLockModal } from '../pages/AuthPages';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main id="content" className="public-main">
        <Outlet />
      </main>
      <PublicFooter />
      <GuestLockModal />
    </div>
  );
}
