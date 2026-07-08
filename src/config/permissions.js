const UserRoles = require('../common/enums/user-roles.enum');
const Permissions = require('../common/enums/permissions.enum');

const rolePermissions = Object.freeze({
  [UserRoles.CITIZEN]: Object.freeze([
    Permissions.SERVICE_VIEW,
    Permissions.REQUEST_CREATE,
    Permissions.REQUEST_VIEW_OWN,
    Permissions.DOCUMENT_UPLOAD,
    Permissions.DOCUMENT_VIEW,
  ]),
  [UserRoles.AGENT]: Object.freeze([
    Permissions.SERVICE_VIEW,
    Permissions.REQUEST_VIEW_ALL,
    Permissions.REQUEST_UPDATE_STATUS,
    Permissions.DOCUMENT_UPLOAD,
    Permissions.DOCUMENT_VIEW,
    Permissions.DOCUMENT_VERIFY,
  ]),
  [UserRoles.ADMIN]: Object.freeze([
    Permissions.SERVICE_CREATE,
    Permissions.SERVICE_UPDATE,
    Permissions.SERVICE_DELETE,
    Permissions.SERVICE_VIEW,
    Permissions.REQUEST_VIEW_ALL,
    Permissions.REQUEST_UPDATE_STATUS,
    Permissions.DOCUMENT_VIEW,
    Permissions.DOCUMENT_VERIFY,
    Permissions.AGENT_VERIFY,
    Permissions.AGENT_VIEW,
    Permissions.ADMIN_DASHBOARD,
  ]),
});

const getPermissionsForRole = (role) => rolePermissions[role] || [];

const roleHasPermission = (role, permission) => getPermissionsForRole(role).includes(permission);

module.exports = {
  getPermissionsForRole,
  roleHasPermission,
  rolePermissions,
};
