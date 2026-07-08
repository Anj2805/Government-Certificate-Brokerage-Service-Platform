const { Router } = require('express');
const Permissions = require('../../common/enums/permissions.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const authenticate = require('../../middlewares/auth.middleware');
const { authorizePermission, authorizeRoles } = require('../../middlewares/role.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const adminController = require('./admin.controller');
const adminValidation = require('./admin.validation');

const router = Router();

router.use(authenticate, authorizeRoles(UserRoles.ADMIN));

router.get(
  '/dashboard/metrics',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  adminController.getDashboardMetrics,
);

router.get(
  '/agents',
  authorizePermission(Permissions.AGENT_VIEW),
  validateRequest(adminValidation.listAgents),
  adminController.listAgents,
);

router.patch(
  '/agents/:id/approve',
  authorizePermission(Permissions.AGENT_VERIFY),
  validateRequest(adminValidation.approveAgent),
  adminController.approveAgent,
);

router.patch(
  '/agents/:id/reject',
  authorizePermission(Permissions.AGENT_VERIFY),
  validateRequest(adminValidation.rejectAgent),
  adminController.rejectAgent,
);

router.patch(
  '/agents/:id/suspend',
  authorizePermission(Permissions.AGENT_VERIFY),
  validateRequest(adminValidation.suspendAgent),
  adminController.suspendAgent,
);

router.get(
  '/requests',
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  validateRequest(adminValidation.listRequests),
  adminController.listRequests,
);

router.get(
  '/requests/:id',
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  validateRequest(adminValidation.getRequestDetails),
  adminController.getRequestDetails,
);

module.exports = router;
