const crypto = require('crypto');
const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const config = require('../../config');
const logger = require('../../config/logger');
const UserRoles = require('../../common/enums/user-roles.enum');
const AgentStatus = require('../../common/enums/agent-status.enum');
const emailService = require('../../services/email.service');
const User = require('../users/user.model');
const { toSafeUser } = require('../users/user.dto');
const { comparePassword, hashPassword } = require('./password.util');
const { generateSecureToken, hashSecureToken } = require('./security-token.util');
const {
  generatePasswordResetToken,
  hashPasswordResetToken,
} = require('./password-reset.util');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('./jwt.util');

const hashRefreshToken = (refreshToken) =>
  crypto.createHash('sha256').update(refreshToken).digest('hex');

const FORGOT_PASSWORD_MESSAGE = 'If an account exists for this email, password reset instructions have been sent.';
const VERIFICATION_RESEND_MESSAGE = 'If an eligible account exists for this email, a verification message has been sent.';

const issueVerificationEmail = async (user) => {
  const token = generateSecureToken();
  const tokenHash = hashSecureToken(token);
  const expiresAt = new Date(Date.now() + config.emailVerification.tokenTtlHours * 60 * 60 * 1000);
  const verificationUrl = `${config.frontend.url.replace(/\/$/, '')}/verify-email/${encodeURIComponent(token)}`;

  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  await user.save();

  try {
    await emailService.sendEmailVerificationEmail({
      to: user.email,
      verificationUrl,
      expiresInHours: config.emailVerification.tokenTtlHours,
    });
  } catch (error) {
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    logger.error(
      { err: error, userId: user.id },
      'Verification email delivery failed',
    );
  }
};

const buildAuthPayload = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: toSafeUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

const register = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'A user with this email already exists');
  }

  const role = payload.role || UserRoles.CITIZEN;

  if (role !== UserRoles.CITIZEN && role !== UserRoles.AGENT) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Public registration is only allowed for citizen or agent accounts');
  }

  const userFields = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    role,
    password: await hashPassword(payload.password),
    isActive: true,
  };

  if (role === UserRoles.AGENT) {
    userFields.agentStatus = AgentStatus.PENDING;
  } else {
    userFields.agentStatus = undefined;
  }

  const user = await User.create(userFields);

  await issueVerificationEmail(user);

  return buildAuthPayload(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshTokenHash');

  if (!user || !(await comparePassword(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User account is inactive');
  }

  return buildAuthPayload(user);
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authenticated user was not found');
  }

  return toSafeUser(user);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select(
    '+password +refreshTokenHash +passwordResetTokenHash +passwordResetExpiresAt',
  );

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authenticated user was not found');
  }

  const currentPasswordMatches = await comparePassword(currentPassword, user.password);
  if (!currentPasswordMatches) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
  }

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be different from current password');
  }

  user.password = await hashPassword(newPassword);
  user.refreshTokenHash = undefined;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
};

const requestPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt',
  );

  if (!user || !user.isActive) {
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + config.passwordReset.tokenTtlMinutes * 60 * 1000);
  const resetUrl = `${config.frontend.url.replace(/\/$/, '')}/reset-password/${encodeURIComponent(token)}`;

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = expiresAt;
  await user.save();

  try {
    await emailService.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      expiresInMinutes: config.passwordReset.tokenTtlMinutes,
    });
  } catch (error) {
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    logger.error(
      {
        err: error,
        userId: user.id,
      },
      'Password reset email delivery failed',
    );
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
};

const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = hashPasswordResetToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+password +refreshTokenHash +passwordResetTokenHash +passwordResetExpiresAt');

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset token is invalid or has expired.');
  }

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be different from current password');
  }

  user.password = await hashPassword(newPassword);
  user.refreshTokenHash = undefined;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
};

const verifyEmail = async ({ token }) => {
  const tokenHash = hashSecureToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email verification link is invalid or has expired.');
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();
};

const resendVerificationEmail = async ({ email }) => {
  const user = await User.findOne({ email }).select(
    '+emailVerificationTokenHash +emailVerificationExpiresAt',
  );

  // Return generic response if user doesn't exist, is inactive, or is already verified
  if (!user || !user.isActive || user.emailVerified || user.role === UserRoles.ADMIN) {
    return { message: VERIFICATION_RESEND_MESSAGE };
  }

  await issueVerificationEmail(user);

  return { message: VERIFICATION_RESEND_MESSAGE };
};

const refreshAccessToken = async (refreshToken) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  if (payload.tokenType !== 'refresh') {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');

  if (!user || !user.isActive || !user.refreshTokenHash) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  if (user.refreshTokenHash !== hashRefreshToken(refreshToken)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  return buildAuthPayload(user);
};

const logout = async (userId) => {
  const user = await User.findById(userId).select('+refreshTokenHash');

  if (!user) {
    return;
  }

  user.refreshTokenHash = undefined;
  await user.save();
};

module.exports = {
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  FORGOT_PASSWORD_MESSAGE,
  VERIFICATION_RESEND_MESSAGE,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  refreshAccessToken,
  register,
};
