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

const assignAgent = asyncHandler(async (req, res) => {
  const request = await adminService.assignAgent(req.params.id, req.body, req.user);

  return ApiResponse.success(res, {
    message: 'Agent assigned successfully',
    data: { request },
  });
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const request = await adminService.updateRequestStatus(req.params.id, req.body, req.user);

  return ApiResponse.success(res, {
    message: 'Request status updated successfully',
    data: { request },
  });
});

module.exports = {
  approveAgent,
  assignAgent,
  getDashboardMetrics,
  getRequestDetails,
  listAgents,
  listRequests,
  rejectAgent,
  suspendAgent,
  updateRequestStatus,
};
