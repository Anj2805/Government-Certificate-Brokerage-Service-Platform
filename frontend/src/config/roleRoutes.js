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
