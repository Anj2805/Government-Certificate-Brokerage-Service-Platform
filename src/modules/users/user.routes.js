const { Router } = require('express');
const authenticate = require('../../middlewares/auth.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const userController = require('./user.controller');
const userValidation = require('./user.validation');

const router = Router();

router.get('/me/profile', authenticate, userController.getMyProfile);

const { uploadSingleDocument } = require('../../middlewares/upload.middleware');

router.patch(
  '/me/profile',
  authenticate,
  validateRequest(userValidation.updateMyProfile),
  userController.updateMyProfile,
);

router.post(
  '/me/profile/photo',
  authenticate,
  uploadSingleDocument('photo'),
  userController.uploadProfilePhoto
);

router.delete(
  '/me/profile/photo',
  authenticate,
  userController.removeProfilePhoto
);

router.get(
  '/me/profile/photo',
  authenticate,
  userController.getProfilePhoto
);

router.post(
  '/me/id-proof',
  authenticate,
  uploadSingleDocument('document'),
  userController.uploadIdProof
);

// Admin route to verify/reject ID
const { authorizeRoles } = require('../../middlewares/role.middleware');
const UserRoles = require('../../common/enums/user-roles.enum');

router.patch(
  '/:id/id-proof-status',
  authenticate,
  authorizeRoles(UserRoles.ADMIN),
  userController.verifyIdProof
);

module.exports = router;
