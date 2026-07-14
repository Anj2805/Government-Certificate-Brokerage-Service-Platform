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
  '/:id',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.updateDraft),
  requestController.updateDraft,
);

router.post(
  '/:id/submit',
  authenticate,
  requireVerifiedEmail,
  authorizePermission(Permissions.REQUEST_CREATE),
  validateRequest(requestValidation.submitRequest),
  requestController.submitRequest,
);

router.post(
  '/:id/record-payment',
  authenticate,
  authorizeAnyPermission(Permissions.REQUEST_PROCESS, Permissions.REQUEST_MANAGE),
  authorizeRoles(UserRoles.AGENT, UserRoles.ADMIN),
  validateRequest(requestValidation.recordPayment),
  requestController.recordPayment,
);

router.post(
  '/:id/withdraw',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.withdrawRequest),
  requestController.withdrawRequest,
);

router.post(
  '/:id/resubmit',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.submitRequest),
  requestController.resubmitRequest,
);

router.post(
  '/:id/documents',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_OWN),
  validateRequest(requestValidation.attachDocument),
  requestController.attachDocument,
);

router.post(
  '/admin/:id/assign',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.ADMIN),
  validateRequest(requestValidation.assignAgent),
  requestController.assignAgent,
);

router.post(
  '/admin/:id/reassign',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.ADMIN),
  validateRequest(requestValidation.assignAgent),
  requestController.reassignAgent,
);

router.post(
  '/agent/:id/start-processing',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT),
  validateRequest(requestValidation.getRequest),
  requestController.startProcessing,
);

router.post(
  '/agent/:id/request-correction',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT, UserRoles.ADMIN),
  validateRequest(requestValidation.requestCorrection),
  requestController.requestCorrection,
);

router.post(
  '/agent/:id/approve',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT),
  validateRequest(requestValidation.approveRequest),
  requestController.approveRequest,
);

router.post(
  '/agent/:id/reject',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT),
  validateRequest(requestValidation.rejectRequest),
  requestController.rejectRequest,
);

router.post(
  '/agent/:id/dispatch',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT, UserRoles.ADMIN),
  requestController.dispatchDelivery,
);

router.post(
  '/agent/:id/verify-delivery',
  authenticate,
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  authorizeRoles(UserRoles.AGENT, UserRoles.ADMIN),
  validateRequest(requestValidation.verifyDelivery),
  requestController.verifyDelivery,
);

module.exports = router;
