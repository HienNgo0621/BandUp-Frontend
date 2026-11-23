import { Navigate, Outlet } from 'react-router-dom';
import type { AppRole } from '../../types/common';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_BASE_PATH } from '../../data/navigation';
export function RoleGuard({ allowedRoles }: { allowedRoles: AppRole[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to={ROLE_BASE_PATH[user.role]} replace />;
}
