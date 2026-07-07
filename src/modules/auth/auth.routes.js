const { Router } = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const authenticate = require('../../middlewares/auth.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const { forgotPasswordLimiter, resendVerificationLimiter } = require('./auth.rate-limit');

const router = Router();

router.post('/register', validateRequest(authValidation.register), authController.register);
router.post('/login', validateRequest(authValidation.login), authController.login);
router.post('/refresh-token', validateRequest(authValidation.refreshToken), authController.refreshToken);
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateRequest(authValidation.forgotPassword),
  authController.forgotPassword,
);
router.post('/reset-password', validateRequest(authValidation.resetPassword), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.post(
  '/change-password',
  authenticate,
  validateRequest(authValidation.changePassword),
  authController.changePassword,
);
router.post('/verify-email', validateRequest(authValidation.verifyEmail), authController.verifyEmail);
router.post(
  '/resend-verification',
  resendVerificationLimiter,
  validateRequest(authValidation.resendVerification),
  authController.resendVerification,
);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
