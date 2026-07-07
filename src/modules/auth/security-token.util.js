const crypto = require('crypto');

const generateSecureToken = () => crypto.randomBytes(32).toString('base64url');

const hashSecureToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  generateSecureToken,
  hashSecureToken,
};
