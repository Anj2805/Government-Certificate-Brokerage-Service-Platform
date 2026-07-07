import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/feedback/LoadingScreen';
import { PATHS } from '../config/paths';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
