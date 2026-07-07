const jwt = require('jsonwebtoken');
const config = require('../../config');

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: config.appName,
    },
  );

const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      tokenType: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.appName,
    },
  );

const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret, {
    issuer: config.appName,
  });

const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret, {
    issuer: config.appName,
  });

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
