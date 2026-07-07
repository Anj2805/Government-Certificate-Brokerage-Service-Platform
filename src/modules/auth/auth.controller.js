const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'User registered successfully',
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);

  return ApiResponse.success(res, {
    message: 'User logged in successfully',
    data,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  return ApiResponse.success(res, {
    message: 'Current user fetched successfully',
    data: { user },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await authService.refreshAccessToken(req.body.refreshToken);

  return ApiResponse.success(res, {
    message: 'Token refreshed successfully',
    data,
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  return ApiResponse.success(res, {
    message: 'User logged out successfully',
  });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);

  return ApiResponse.success(res, {
    message: 'Password changed successfully. Please sign in again.',
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);

  return ApiResponse.success(res, {
    message: 'Password reset successfully. Please sign in with your new password.',
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body);

  return ApiResponse.success(res, {
    message: 'Email verified successfully.',
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.body);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  verifyEmail,
  resendVerification,
};
