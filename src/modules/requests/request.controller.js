const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const requestService = require('./request.service');

const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.body, req.user, req.id);

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
  const request = await requestService.submitRequest(req.params.id, req.user, req.body.reason, req.id);

  return ApiResponse.success(res, {
    message: 'Request submitted successfully',
    data: { request },
  });
});

const assignAgent = asyncHandler(async (req, res) => {
  const request = await requestService.assignAgent(
    req.params.id,
    req.body.agentId,
    req.user,
    req.body.reason,
    req.id
  );

  return ApiResponse.success(res, {
    message: 'Agent assigned successfully',
    data: { request },
  });
});

const withdrawRequest = asyncHandler(async (req, res) => {
  const request = await requestService.withdrawRequest(req.params.id, req.user, req.body.reason, req.id);

  return ApiResponse.success(res, {
    message: 'Request withdrawn successfully',
    data: { request },
  });
});

const reassignAgent = asyncHandler(async (req, res) => {
  const request = await requestService.reassignAgent(
    req.params.id,
    req.body.agentId,
    req.user,
    req.body.reason,
    req.id
  );

  return ApiResponse.success(res, {
    message: 'Agent reassigned successfully',
    data: { request },
  });
});

const startProcessing = asyncHandler(async (req, res) => {
  const request = await requestService.startProcessing(req.params.id, req.user, req.id);

  return ApiResponse.success(res, {
    message: 'Started processing request',
    data: { request },
  });
});

const requestCorrection = asyncHandler(async (req, res) => {
  const request = await requestService.requestCorrection(req.params.id, req.user, req.body.reason, req.id);

  return ApiResponse.success(res, {
    message: 'Correction requested successfully',
    data: { request },
  });
});

const approveRequest = asyncHandler(async (req, res) => {
  const request = await requestService.approveRequest(req.params.id, req.user, req.body.reason, req.id);

  return ApiResponse.success(res, {
    message: 'Request approved successfully',
    data: { request },
  });
});

const rejectRequest = asyncHandler(async (req, res) => {
  const request = await requestService.rejectRequest(req.params.id, req.user, req.body.reason, req.id);

  return ApiResponse.success(res, {
    message: 'Request rejected successfully',
    data: { request },
  });
});

const resubmitRequest = asyncHandler(async (req, res) => {
  const request = await requestService.resubmitRequest(req.params.id, req.user, req.body.reason, req.id);

  return ApiResponse.success(res, {
    message: 'Request resubmitted successfully',
    data: { request },
  });
});

const updateDraft = asyncHandler(async (req, res) => {
  const request = await requestService.updateDraft(req.params.id, req.body, req.user, req.id);

  return ApiResponse.success(res, {
    message: 'Draft updated successfully',
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
  reassignAgent,
  withdrawRequest,
  createRequest,
  updateDraft,
  getRequestDetails,
  listAllRequests,
  listAssignedRequests,
  listOwnRequests,
  submitRequest,
  resubmitRequest,
  startProcessing,
  requestCorrection,
  approveRequest,
  rejectRequest,
  getRequestsSummary,
  attachDocument,
};
