const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const userService = require('./user.service');

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user.id);

  return ApiResponse.success(res, {
    message: 'Profile retrieved successfully',
    data: { user },
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateMyProfile(req.user.id, req.body);

  return ApiResponse.success(res, {
    message: 'Profile updated successfully',
    data: { user },
  });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const user = await userService.uploadProfilePhoto(req.user.id, req.file);
  return ApiResponse.success(res, {
    message: 'Profile photo uploaded successfully',
    data: { user },
  });
});

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const user = await userService.removeProfilePhoto(req.user.id);
  return ApiResponse.success(res, {
    message: 'Profile photo removed successfully',
    data: { user },
  });
});

const getProfilePhoto = asyncHandler(async (req, res) => {
  const downloadStrategy = await userService.getProfilePhotoStrategy(req.user.id);
  if (!downloadStrategy) {
    return res.status(httpStatus.NOT_FOUND).send('Profile photo not found');
  }
  if (downloadStrategy.type === 'redirect') {
    return res.redirect(downloadStrategy.url);
  }
  return res.sendFile(downloadStrategy.physicalPath);
});

const uploadIdProof = asyncHandler(async (req, res) => {
  const user = await userService.uploadIdProof(req.user.id, req.body, req.file);
  return ApiResponse.success(res, {
    message: 'ID proof uploaded successfully',
    data: { user },
  });
});

const verifyIdProof = asyncHandler(async (req, res) => {
  const user = await userService.verifyIdProof(req.params.id, req.body, req.user);
  return ApiResponse.success(res, {
    message: 'ID proof status updated successfully',
    data: { user },
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getProfilePhoto,
  uploadIdProof,
  verifyIdProof,
};
