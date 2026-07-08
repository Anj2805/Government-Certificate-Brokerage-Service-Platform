const { Router } = require('express');
const authenticate = require('../../middlewares/auth.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const certificateController = require('./certificate.controller');
const certificateValidation = require('./certificate.validation');
const rateLimit = require('express-rate-limit');

const router = Router();

const publicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many verification requests from this IP, please try again later.',
});

router.get(
  '/verify/:publicVerificationId',
  publicVerifyLimiter,
  validateRequest(certificateValidation.verifyPublicCertificate),
  certificateController.verifyPublicCertificate,
);

router.get(
  '/:id/download',
  authenticate,
  validateRequest(certificateValidation.downloadCertificate),
  certificateController.downloadCertificate,
);

module.exports = router;
