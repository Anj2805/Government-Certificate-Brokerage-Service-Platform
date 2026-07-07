const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const requestService = require('./request.service');

const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.body, req.user);

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'Request created successfully',
    data: { request },
  });
});

const listOwnRequests = asyncHandler(async (req, res) => {
  const result = await requestService.listRequests({ query: req.query, user: req.user, scope: 'own' });

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

const listAssignedRequests = asyncHandler(async (req, res) => {
  const result = await requestService.listRequests({ query: req.query, user: req.user, scope: 'assigned' });

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

const listAllRequests = asyncHandler(async (req, res) => {
  const result = await requestService.listRequests({ query: req.query, user: req.user, scope: 'all' });

  return ApiResponse.success(res, {
    message: 'All requests fetched successfully',
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
  const request = await requestService.getRequestDetails(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Request details fetched successfully',
    data: { request },
  });
});

const submitRequest = asyncHandler(async (req, res) => {
  const request = await requestService.submitRequest(req.params.id, req.user, req.body.reason);

  return ApiResponse.success(res, {
    message: 'Request submitted successfully',
    data: { request },
  });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const request = await requestService.cancelRequest(req.params.id, req.user, req.body.reason);

  return ApiResponse.success(res, {
    message: 'Request cancelled successfully',
    data: { request },
  });
});

const assignAgent = asyncHandler(async (req, res) => {
  const request = await requestService.assignAgent(
    req.params.id,
    req.body.agentId,
    req.user,
    req.body.reason,
  );

  return ApiResponse.success(res, {
    message: 'Agent assigned successfully',
    data: { request },
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const request = await requestService.updateStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.reason,
  );

  return ApiResponse.success(res, {
    message: 'Request status updated successfully',
    data: { request },
  });
});

const getRequestsSummary = asyncHandler(async (req, res) => {
  const summary = await requestService.getRequestsSummary(req.user);

  return ApiResponse.success(res, {
    message: 'Requests summary fetched successfully',
    data: summary,
  });
});

const attachDocument = asyncHandler(async (req, res) => {
  const request = await requestService.attachDocument(
    req.params.id,
    req.body.documentId,
    req.user,
  );

  return ApiResponse.success(res, {
    message: 'Document attached successfully',
    data: { request },
  });
});

module.exports = {
  assignAgent,
  cancelRequest,
  createRequest,
  getRequestDetails,
  listAllRequests,
  listAssignedRequests,
  listOwnRequests,
  submitRequest,
  updateStatus,
  getRequestsSummary,
  attachDocument,
};
