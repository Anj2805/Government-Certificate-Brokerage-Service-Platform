const { Router } = require('express');
const Permissions = require('../../common/enums/permissions.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const authenticate = require('../../middlewares/auth.middleware');
const {
  authorizeAnyPermission,
  authorizePermission,
  authorizeRoles,
} = require('../../middlewares/role.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const requestController = require('./request.controller');
const requestValidation = require('./request.validation');
const requireVerifiedEmail = require('../../middlewares/require-verified-email.middleware');

const router = Router();

router.post(
  '/',
  authenticate,
  authorizePermission(Permissions.REQUEST_CREATE),
  validateRequest(requestValidation.createRequest),
  requestController.createRequest,
);

router.get(
  '/my',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.listRequests),
  requestController.listOwnRequests,
);

router.get(
  '/my/summary',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  requestController.getRequestsSummary,
);

router.get(
  '/assigned',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  authorizeRoles(UserRoles.AGENT),
  validateRequest(requestValidation.listRequests),
  requestController.listAssignedRequests,
);

router.get(
  '/',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  authorizeRoles(UserRoles.ADMIN),
  validateRequest(requestValidation.listRequests),
  requestController.listAllRequests,
);

router.get(
  '/:id',
  authenticate,
  authorizeAnyPermission(Permissions.REQUEST_VIEW_OWN, Permissions.REQUEST_VIEW_ALL),
  validateRequest(requestValidation.getRequest),
  requestController.getRequestDetails,
);

router.patch(
  '/:id/submit',
  authenticate,
  requireVerifiedEmail,
  authorizePermission(Permissions.REQUEST_CREATE),
  validateRequest(requestValidation.submitRequest),
  requestController.submitRequest,
);

router.patch(
  '/:id/cancel',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.cancelRequest),
  requestController.cancelRequest,
);

router.post(
  '/:id/documents',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.attachDocument),
  requestController.attachDocument,
);

router.patch(
  '/:id/assign-agent',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.ADMIN),
  validateRequest(requestValidation.assignAgent),
  requestController.assignAgent,
);

router.patch(
  '/:id/progress',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT),
  validateRequest(requestValidation.updateProgress),
  requestController.updateStatus,
);

router.patch(
  '/:id/status',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.ADMIN),
  validateRequest(requestValidation.updateStatus),
  requestController.updateStatus,
);

module.exports = router;
