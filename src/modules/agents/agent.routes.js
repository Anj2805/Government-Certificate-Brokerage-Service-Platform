const { Router } = require('express');
const Permissions = require('../../common/enums/permissions.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const authenticate = require('../../middlewares/auth.middleware');
const { authorizePermission, authorizeRoles } = require('../../middlewares/role.middleware');
const { uploadSingleDocument } = require('../../middlewares/upload.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const agentController = require('./agent.controller');
const agentValidation = require('./agent.validation');

const router = Router();

const ensureApprovedAgent = (req, res, next) => {
  const ApiError = require('../../common/errors/api-error');
  const httpStatus = require('http-status');

  if (!req.user || !req.user.emailVerified) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Email verification is required to access agent services.'));
  }

  if (req.user.agentStatus !== 'approved') {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Your agent account is pending approval or not active'));
  }
  next();
};

router.use(authenticate, authorizeRoles(UserRoles.AGENT), ensureApprovedAgent);

router.get('/profile', agentController.getProfile);

router.patch(
  '/profile',
  validateRequest(agentValidation.updateProfile),
  agentController.updateProfile
);

router.post(
  '/profile/photo',
  uploadSingleDocument('photo'),
  agentController.uploadProfilePhoto
);

router.delete('/profile/photo', agentController.removeProfilePhoto);

// Note: This endpoint streams/redirects the profile photo inline (no attachment)
router.get('/profile/photo', agentController.getProfilePhoto);

router.get(
  '/dashboard/stats',
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  agentController.getDashboardStats,
);

router.get(
  '/requests',
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  validateRequest(agentValidation.listAssignedRequests),
  agentController.listAssignedRequests,
);

router.get(
  '/requests/:id',
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  validateRequest(agentValidation.getRequestDetails),
  agentController.getRequestDetails,
);

router.patch(
  '/requests/:id/progress',
  authorizePermission(Permissions.REQUEST_UPDATE_STATUS),
  validateRequest(agentValidation.updateProgress),
  agentController.updateProgress,
);

router.post(
  '/requests/:id/documents',
  authorizePermission(Permissions.DOCUMENT_UPLOAD),
  uploadSingleDocument('document'),
  validateRequest(agentValidation.uploadAdditionalDocument),
  agentController.uploadAdditionalDocument,
);

module.exports = router;
