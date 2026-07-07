import { Navigate, Outlet } from 'react-router-dom';
import { getDashboardPathByRole } from '../config/roleRoutes';
import { useAuth } from '../hooks/useAuth';

export default function PublicOnlyRoute() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getDashboardPathByRole(role)} replace />;
  }

  return <Outlet />;
}
