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

module.exports = {
  getMyProfile,
  updateMyProfile,
};
