class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
    const payload = {
      success: true,
      message,
    };

    if (data !== null) {
      payload.data = data;
    }

    if (meta !== null) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  static error(
    res,
    { statusCode = 500, message = 'Internal server error', details = null, stack = null } = {},
  ) {
    const payload = {
      success: false,
      message,
    };

    if (details !== null) {
      payload.details = details;
    }

    if (stack !== null) {
      payload.stack = stack;
    }

    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
