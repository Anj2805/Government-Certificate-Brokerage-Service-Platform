const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const agentService = require('./agent.service');

const listAssignedRequests = asyncHandler(async (req, res) => {
  const result = await agentService.listAssignedRequests(req.query, req.user);

  return ApiResponse.success(res, {
    message: 'Assigned requests fetched successfully',
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
  const request = await agentService.getRequestDetails(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Assigned request details fetched successfully',
    data: { request },
  });
});

const updateProgress = asyncHandler(async (req, res) => {
  const request = await agentService.updateProgress(req.params.id, req.body, req.user);

  return ApiResponse.success(res, {
    message: 'Request progress updated successfully',
    data: { request },
  });
});

const uploadAdditionalDocument = asyncHandler(async (req, res) => {
  const document = await agentService.uploadAdditionalDocument({
    requestId: req.params.id,
    file: req.file,
    payload: req.body,
    agentUser: req.user,
  });

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'Additional document uploaded successfully',
    data: { document },
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await agentService.getDashboardStats(req.user.id);

  return ApiResponse.success(res, {
    message: 'Agent dashboard statistics fetched successfully',
    data: { stats },
  });
});

module.exports = {
  getDashboardStats,
  getRequestDetails,
  listAssignedRequests,
  updateProgress,
  uploadAdditionalDocument,
};
