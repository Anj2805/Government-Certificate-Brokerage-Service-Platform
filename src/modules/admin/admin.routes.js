const { Router } = require('express');
const Permissions = require('../../common/enums/permissions.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const authenticate = require('../../middlewares/auth.middleware');
const { authorizePermission, authorizeRoles } = require('../../middlewares/role.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const adminController = require('./admin.controller');
const adminJobsController = require('./admin-jobs.controller');
const adminValidation = require('./admin.validation');
const asyncHandler = require('../../utils/async-handler');

const router = Router();

router.use(authenticate, authorizeRoles(UserRoles.ADMIN));

router.get(
  '/dashboard/metrics',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  adminController.getDashboardMetrics,
);

router.get(
  '/analytics',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  adminController.getAnalytics,
);

router.get(
  '/search',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  adminController.globalSearch,
);

router.get(
  '/users',
  authorizePermission(Permissions.ADMIN_DASHBOARD), // Assuming ADMIN_DASHBOARD covers user viewing for now, or maybe create a specific permission
  adminController.listUsers,
);

router.get(
  '/users/:id',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  adminController.getUserDetails,
);

router.get(
  '/agents',
  authorizePermission(Permissions.AGENT_VIEW),
  validateRequest(adminValidation.listAgents),
  adminController.listAgents,
);

router.get(
  '/agents/:id',
  authorizePermission(Permissions.AGENT_VIEW),
  adminController.getAgentDetails,
);

router.patch(
  '/agents/:id/approve',
  authorizePermission(Permissions.AGENT_VERIFY),
  validateRequest(adminValidation.approveAgent),
  adminController.approveAgent,
);

router.patch(
  '/agents/:id/background',
  authorizePermission(Permissions.AGENT_VERIFY),
  validateRequest(adminValidation.updateAgentBackground),
  adminController.updateAgentBackground,
);

router.patch(
  '/agents/:id/department',
  authorizePermission(Permissions.AGENT_VERIFY),
  validateRequest(adminValidation.updateAgentDepartment),
  adminController.updateAgentDepartment,
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

router.get(
  '/jobs/dead-letter',
  authorizePermission(Permissions.ADMIN_DASHBOARD), // Reusing dashboard permission for queue visibility
  asyncHandler(adminJobsController.listDeadLetters),
);

router.get(
  '/jobs/dead-letter/:jobId',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  asyncHandler(adminJobsController.getDeadLetterDetails),
);

router.post(
  '/jobs/:jobId/replay',
  authorizePermission(Permissions.ADMIN_DASHBOARD),
  asyncHandler(adminJobsController.replayDeadLetter),
);

module.exports = router;
