const httpStatus = require('http-status');
const fs = require('fs/promises');
const { validationResult } = require('express-validator');
const ApiError = require('../common/errors/api-error');

const validateRequest = (validations) => async (req, _res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  if (req.file?.path) {
    await fs.unlink(req.file.path).catch(() => {});
  }

  return next(
    new ApiError(httpStatus.BAD_REQUEST, 'Request validation failed', {
      details: result.array().map((error) => ({
        field: error.path,
        location: error.location,
        message: error.msg,
        value: error.value,
      })),
    }),
  );
};

module.exports = validateRequest;
