const { generateSecureToken, hashSecureToken } = require('./security-token.util');

const generatePasswordResetToken = () => generateSecureToken();
const hashPasswordResetToken = (token) => hashSecureToken(token);

module.exports = {
  generatePasswordResetToken,
  hashPasswordResetToken,
};
