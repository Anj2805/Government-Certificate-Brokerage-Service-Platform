const httpStatus = require('http-status');
const ApiError = require('../common/errors/api-error');
const User = require('../modules/users/user.model');
const { verifyAccessToken } = require('../modules/auth/jwt.util');

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const authenticate = async (req, _res, next) => {
  try {
    let token = extractBearerToken(req.headers.authorization);
    
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token is required');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('_id firstName lastName email role isActive agentStatus emailVerified');

    if (!user || !user.isActive) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authentication token');
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      agentStatus: user.agentStatus,
      emailVerified: user.emailVerified,
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired authentication token'));
  }
};

module.exports = authenticate;
