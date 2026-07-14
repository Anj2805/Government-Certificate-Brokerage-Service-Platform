import { PATHS } from './paths';
import { ROLES } from './roles';

export const DASHBOARD_PATH_BY_ROLE = Object.freeze({
  [ROLES.CITIZEN]: PATHS.CITIZEN_DASHBOARD,
  [ROLES.AGENT]: PATHS.AGENT_DASHBOARD,
  [ROLES.ADMIN]: PATHS.ADMIN_DASHBOARD,
});

export function getDashboardPathByRole(role) {
  return DASHBOARD_PATH_BY_ROLE[role] || PATHS.HOME;
}

export const NOTIFICATIONS_PATH_BY_ROLE = Object.freeze({
  [ROLES.CITIZEN]: PATHS.CITIZEN_NOTIFICATIONS,
  [ROLES.AGENT]: PATHS.AGENT_NOTIFICATIONS,
  [ROLES.ADMIN]: PATHS.ADMIN_NOTIFICATIONS,
});

export function getNotificationsPathByRole(role) {
  return NOTIFICATIONS_PATH_BY_ROLE[role] || PATHS.HOME;
}
