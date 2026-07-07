const pino = require('pino');
const config = require('./index');

const logger = pino({
  level: config.logging.level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordConfirmation',
      'token',
      'refreshToken',
      'accessToken',
      'jwt',
      'secret',
      'otp'
    ],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
