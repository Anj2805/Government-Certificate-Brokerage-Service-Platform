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

const optionalAuthenticate = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      req.user = undefined;
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('_id firstName lastName email role isActive agentStatus');

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        role: user.role,
        email: user.email,
        agentStatus: user.agentStatus,
      };
    } else {
      req.user = undefined;
    }

    return next();
  } catch (error) {
    // Treat invalid or expired token as guest
    req.user = undefined;
    return next();
  }
};

module.exports = optionalAuthenticate;
