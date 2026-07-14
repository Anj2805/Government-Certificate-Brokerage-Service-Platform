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

const getProfile = asyncHandler(async (req, res) => {
  const profile = await agentService.getProfile(req.user.id);
  return ApiResponse.success(res, {
    message: 'Profile fetched successfully',
    data: { profile },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await agentService.updateProfile(req.user.id, req.body);
  return ApiResponse.success(res, {
    message: 'Profile updated successfully',
    data: { profile },
  });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const profile = await agentService.uploadProfilePhoto(req.user.id, req.file);
  return ApiResponse.success(res, {
    message: 'Profile photo uploaded successfully',
    data: { profile },
  });
});

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const profile = await agentService.removeProfilePhoto(req.user.id);
  return ApiResponse.success(res, {
    message: 'Profile photo removed successfully',
    data: { profile },
  });
});

const getProfilePhoto = asyncHandler(async (req, res) => {
  const downloadStrategy = await agentService.getProfilePhotoStrategy(req.user.id);
  if (!downloadStrategy) {
    return res.status(httpStatus.NOT_FOUND).send('Profile photo not found');
  }
  if (downloadStrategy.type === 'redirect') {
    return res.redirect(downloadStrategy.url);
  }
  return res.sendFile(downloadStrategy.physicalPath);
});

module.exports = {
  getDashboardStats,
  getRequestDetails,
  listAssignedRequests,
  updateProgress,
  uploadAdditionalDocument,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getProfilePhoto,
};
