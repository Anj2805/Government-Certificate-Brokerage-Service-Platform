const { Router } = require('express');
const authenticate = require('../../middlewares/auth.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const userController = require('./user.controller');
const userValidation = require('./user.validation');

const router = Router();

router.get('/me/profile', authenticate, userController.getMyProfile);

router.patch(
  '/me/profile',
  authenticate,
  validateRequest(userValidation.updateMyProfile),
  userController.updateMyProfile,
);

module.exports = router;
