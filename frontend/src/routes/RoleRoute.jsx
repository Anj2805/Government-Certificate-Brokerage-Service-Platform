import { Navigate, Outlet } from 'react-router-dom';
import { PATHS } from '../config/paths';
import { useAuth } from '../hooks/useAuth';

export default function RoleRoute({ allowedRoles }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={PATHS.HOME} replace />;
  }

  return <Outlet />;
}
