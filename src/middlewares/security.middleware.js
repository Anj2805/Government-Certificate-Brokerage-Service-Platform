const compression = require('compression');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const config = require('../config');
const ApiError = require('../common/errors/api-error');

const configureSecurityMiddleware = (app) => {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.cors.origins.length === 0 || config.cors.origins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new ApiError(403, 'Origin is not allowed by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }),
  );

  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      limit: config.isProduction ? config.rateLimit.maxRequests : 10000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests. Please try again later.',
      },
    }),
  );
};

configureSecurityMiddleware.afterBodyParser = [mongoSanitize(), hpp(), compression()];

module.exports = configureSecurityMiddleware;
