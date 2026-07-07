const httpStatus = require('http-status');
const config = require('../config');
const logger = require('../config/logger');
const ApiError = require('../common/errors/api-error');
const ApiResponse = require('../common/responses/api-response');

const notFoundHandler = (req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

const normalizeError = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error.name === 'ValidationError') {
    return new ApiError(httpStatus.BAD_REQUEST, error.message, {
      details: error.errors,
      isOperational: true,
    });
  }

  if (error.name === 'CastError') {
    return new ApiError(httpStatus.BAD_REQUEST, 'Invalid resource identifier', {
      details: { path: error.path, value: error.value },
      isOperational: true,
    });
  }

  if (error.code === 11000) {
    return new ApiError(httpStatus.CONFLICT, 'Duplicate resource conflict', {
      details: error.keyValue,
      isOperational: true,
    });
  }

  return new ApiError(
    error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
    error.message || 'Internal server error',
    { isOperational: false },
  );
};

const errorHandler = (error, req, res, _next) => {
  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

  let details = null;

  if (normalizedError.details) {
    details = normalizedError.details;
  }

  const logPayload = {
    err: error,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    requestId: req.id,
  };

  if (statusCode >= 500) {
    logger.error(logPayload, normalizedError.message);
  } else {
    logger.warn(logPayload, normalizedError.message);
  }

  ApiResponse.error(res, {
    statusCode,
    message: normalizedError.message,
    details,
    stack: config.isProduction ? null : normalizedError.stack,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
