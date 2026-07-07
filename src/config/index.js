const dotenv = require('dotenv');

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const requiredEnv = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const parseNumber = (value, fallback) => {
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable value: ${value}`);
  }

  return parsed;
};

const parseCorsOrigins = (value) => {
  if (!value) return [];
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const apiVersion = process.env.API_VERSION || 'v1';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appName: process.env.APP_NAME || 'Government Certificate Brokerage Service',
  port: parseNumber(process.env.PORT, 5000),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '10kb',
  urlencodedBodyLimit: process.env.URLENCODED_BODY_LIMIT || '10kb',
  api: {
    version: apiVersion,
    basePath: `/api/${apiVersion}`,
  },
  database: {
    uri: process.env.MONGODB_URI,
    maxPoolSize: parseNumber(process.env.MONGODB_MAX_POOL_SIZE, 10),
  },
  cors: {
    origins: parseCorsOrigins(process.env.CORS_ORIGIN),
  },
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  passwordReset: {
    tokenTtlMinutes: parseNumber(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 15),
  },
  emailVerification: {
    tokenTtlHours: parseNumber(process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS, 24),
  },
  email: {
    from: process.env.EMAIL_FROM || 'SevaSetu <no-reply@sevasetu.local>',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseNumber(process.env.SMTP_PORT, 587),
      secure: parseBoolean(process.env.SMTP_SECURE, false),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
