const mongoose = require('mongoose');
const config = require('../../../config');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../common/responses/api-response');

const getHealth = asyncHandler(async (_req, res) => {
  ApiResponse.success(res, {
    message: 'Service is healthy',
    data: {
      service: config.appName,
      status: 'ok',
      environment: config.env,
      apiVersion: config.api.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
    },
  });
});

module.exports = {
  getHealth,
};
