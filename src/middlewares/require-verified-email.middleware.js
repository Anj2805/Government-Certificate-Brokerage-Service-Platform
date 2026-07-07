const httpStatus = require('http-status');
const ApiError = require('../common/errors/api-error');

const requireVerifiedEmail = (req, res, next) => {
  if (!req.user || !req.user.emailVerified) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Email verification is required before submitting a service request.'));
  }
  next();
};

module.exports = requireVerifiedEmail;
