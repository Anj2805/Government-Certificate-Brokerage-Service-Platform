const httpStatus = require('http-status');
const ApiError = require('../common/errors/api-error');
const { roleHasPermission } = require('../config/permissions');

const requireAuthenticatedUser = (req) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication is required');
  }
};

const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  try {
    requireAuthenticatedUser(req);

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

const authorizePermission = (permission) => (req, _res, next) => {
  try {
    requireAuthenticatedUser(req);

    if (!roleHasPermission(req.user.role, permission)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

const authorizeAnyPermission = (...permissions) => (req, _res, next) => {
  try {
    requireAuthenticatedUser(req);

    const hasAnyPermission = permissions.some((permission) => roleHasPermission(req.user.role, permission));

    if (!hasAnyPermission) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  authorizeAnyPermission,
  authorizePermission,
  authorizeRoles,
};
