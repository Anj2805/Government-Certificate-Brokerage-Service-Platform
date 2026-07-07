class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
