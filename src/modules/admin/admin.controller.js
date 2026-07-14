const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const adminService = require('./admin.service');
const logger = require('../../config/logger');

const getDashboardMetrics = asyncHandler(async (_req, res) => {
  const metrics = await adminService.getDashboardMetrics();

  return ApiResponse.success(res, {
    message: 'Admin dashboard metrics fetched successfully',
    data: { metrics },
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const data = await adminService.getAnalytics(req.query);

  return ApiResponse.success(res, {
    message: 'Admin analytics fetched successfully',
    data,
  });
});

const globalSearch = asyncHandler(async (req, res) => {
  const result = await adminService.globalSearch(req.query.q);
  return ApiResponse.success(res, {
    message: 'Global search completed successfully',
    data: result,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);

  return ApiResponse.success(res, {
    message: 'Users fetched successfully',
    data: { users: result.items },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const getUserDetails = asyncHandler(async (req, res) => {
  const user = await adminService.getUserDetails(req.params.id);

  return ApiResponse.success(res, {
    message: 'User details fetched successfully',
    data: { user },
  });
});

const listAgents = asyncHandler(async (req, res) => {
  const result = await adminService.listAgents(req.query);

  return ApiResponse.success(res, {
    message: 'Agents fetched successfully',
    data: { agents: result.items },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const getAgentDetails = asyncHandler(async (req, res) => {
  const agent = await adminService.getAgentDetails(req.params.id);

  return ApiResponse.success(res, {
    message: 'Agent details fetched successfully',
    data: { agent },
  });
});

const approveAgent = asyncHandler(async (req, res) => {
  const agent = await adminService.approveAgent(req.params.id, req.user);

  logger.info({ audit: true, eventType: 'AGENT_APPROVED', adminId: req.user.id, targetAgentId: req.params.id, requestId: req.id }, 'Agent approved');

  return ApiResponse.success(res, {
    message: 'Agent approved successfully',
    data: { agent },
  });
});

const rejectAgent = asyncHandler(async (req, res) => {
  const agent = await adminService.rejectAgent(req.params.id, req.body.reason, req.user);

  logger.info({ audit: true, eventType: 'AGENT_REJECTED', adminId: req.user.id, targetAgentId: req.params.id, requestId: req.id }, 'Agent rejected');

  return ApiResponse.success(res, {
    message: 'Agent rejected successfully',
    data: { agent },
  });
});

const suspendAgent = asyncHandler(async (req, res) => {
  const agent = await adminService.suspendAgent(req.params.id, req.body.reason, req.user);

  logger.info({ audit: true, eventType: 'AGENT_SUSPENDED', adminId: req.user.id, targetAgentId: req.params.id, requestId: req.id }, 'Agent suspended');

  return ApiResponse.success(res, {
    message: 'Agent suspended successfully',
    data: { agent },
  });
});

const listRequests = asyncHandler(async (req, res) => {
  const result = await adminService.listRequests(req.query, req.user);

  return ApiResponse.success(res, {
    message: 'Requests fetched successfully',
    data: { requests: result.items },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const getRequestDetails = asyncHandler(async (req, res) => {
  const request = await adminService.getRequestDetails(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Request details fetched successfully',
    data: { request },
  });
});

const updateAgentBackground = asyncHandler(async (req, res) => {
  const agent = await adminService.updateAgentBackground(req.params.id, req.body.background);

  logger.info({ audit: true, eventType: 'AGENT_BACKGROUND_UPDATED', adminId: req.user.id, targetAgentId: req.params.id, requestId: req.id }, 'Agent background updated');

  return ApiResponse.success(res, {
    message: 'Agent background updated successfully',
    data: { agent },
  });
});

const updateAgentDepartment = asyncHandler(async (req, res) => {
  const agent = await adminService.updateAgentDepartment(req.params.id, req.body.department);

  logger.info({ audit: true, eventType: 'AGENT_DEPARTMENT_UPDATED', adminId: req.user.id, targetAgentId: req.params.id, requestId: req.id }, 'Agent department updated');

  return ApiResponse.success(res, {
    message: 'Agent department updated successfully',
    data: { agent },
  });
});

module.exports = {
  getDashboardMetrics,
  getAnalytics,
  globalSearch,
  listUsers,
  getUserDetails,
  listAgents,
  getAgentDetails,
  approveAgent,
  rejectAgent,
  suspendAgent,
  suspendAgent,
  updateAgentBackground,
  updateAgentDepartment,
  listRequests,
  getRequestDetails,
};
