import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PublicLayout from '../layouts/PublicLayout';
import AgentAssignedRequests from '../pages/agent/AssignedRequests';
import AgentDashboard from '../pages/agent/Dashboard';
import AgentRequestDetails from '../pages/agent/RequestDetails';
import AdminDashboard from '../pages/admin/Dashboard';
import ManageAgents from '../pages/admin/ManageAgents';
import ManageRequests from '../pages/admin/ManageRequests';
import ManageServices from '../pages/admin/ManageServices';
import AdminRequestDetails from '../pages/admin/RequestDetails';
import DeadLetterJobs from '../pages/admin/DeadLetterJobs';
import CitizenDashboard from '../pages/citizen/Dashboard';
import CreateRequest from '../pages/citizen/CreateRequest';
import CitizenProfile from '../pages/citizen/Profile';
import MyRequests from '../pages/citizen/MyRequests';
import RequestDetails from '../pages/citizen/RequestDetails';
import RequestTrack from '../pages/citizen/RequestTrack';
import CitizenSettings from '../pages/citizen/Settings';
import CitizenNotifications from '../pages/citizen/Notifications';
import ChangePassword from '../pages/citizen/ChangePassword';
import Home from '../pages/public/Home';
import ForgotPassword from '../pages/public/ForgotPassword';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ResetPassword from '../pages/public/ResetPassword';
import VerifyEmail from '../pages/public/VerifyEmail';
import ResendVerification from '../pages/public/ResendVerification';
import Services from '../pages/public/Services';
import ServiceDetails from '../pages/public/ServiceDetails';
import NotFound from '../pages/system/NotFound';
import { PATHS } from '../config/paths';
import { ROLES } from '../config/roles';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleRoute from './RoleRoute';

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: PATHS.HOME, element: <Home /> },
      { path: PATHS.SERVICES, element: <Services /> },
      { path: PATHS.SERVICE_DETAILS, element: <ServiceDetails /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: PATHS.LOGIN, element: <Login /> },
          { path: PATHS.REGISTER, element: <Register /> },
          { path: PATHS.FORGOT_PASSWORD, element: <ForgotPassword /> },
          { path: PATHS.RESET_PASSWORD, element: <ResetPassword /> },
          { path: PATHS.VERIFY_EMAIL, element: <VerifyEmail /> },
          { path: PATHS.RESEND_VERIFICATION, element: <ResendVerification /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <RoleRoute allowedRoles={[ROLES.CITIZEN]} />,
            children: [
              { path: PATHS.CITIZEN_DASHBOARD, element: <CitizenDashboard /> },
              { path: PATHS.CITIZEN_PROFILE, element: <CitizenProfile /> },
              { path: PATHS.CITIZEN_SETTINGS, element: <CitizenSettings /> },
              { path: PATHS.CITIZEN_CHANGE_PASSWORD, element: <ChangePassword /> },
              { path: PATHS.CITIZEN_REQUESTS, element: <MyRequests /> },
              { path: PATHS.CITIZEN_REQUEST_DETAILS, element: <RequestDetails /> },
              { path: PATHS.CITIZEN_REQUEST_TRACK, element: <RequestTrack /> },
              { path: PATHS.CITIZEN_CREATE_REQUEST, element: <CreateRequest /> },
              { path: PATHS.CITIZEN_NOTIFICATIONS, element: <CitizenNotifications /> },
            ],
          },
          {
            element: <RoleRoute allowedRoles={[ROLES.AGENT]} />,
            children: [
              { path: PATHS.AGENT_DASHBOARD, element: <AgentDashboard /> },
              { path: PATHS.AGENT_ASSIGNED_REQUESTS, element: <AgentAssignedRequests /> },
              { path: PATHS.AGENT_CHANGE_PASSWORD, element: <ChangePassword /> },
            ],
          },
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN]} />,
            children: [
              { path: PATHS.ADMIN_DASHBOARD, element: <AdminDashboard /> },
              { path: PATHS.ADMIN_SERVICES, element: <ManageServices /> },
              { path: PATHS.ADMIN_AGENTS, element: <ManageAgents /> },
              { path: PATHS.ADMIN_REQUESTS, element: <ManageRequests /> },
              { path: PATHS.ADMIN_REQUEST_DETAILS, element: <AdminRequestDetails /> },
              { path: PATHS.ADMIN_DEAD_LETTERS, element: <DeadLetterJobs /> },
              { path: PATHS.ADMIN_CHANGE_PASSWORD, element: <ChangePassword /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default router;
