const crypto = require('crypto');
const httpStatus = require('http-status');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const ApiError = require('../../common/errors/api-error');
const config = require('../../config');
const logger = require('../../config/logger');
const UserRoles = require('../../common/enums/user-roles.enum');
const AgentStatus = require('../../common/enums/agent-status.enum');
const jobService = require('../jobs/job.service');
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
  
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  await user.save();

  // Enqueue Outbox Event
  await jobService.enqueueOutboxEvent({
    eventType: 'EMAIL_VERIFICATION_DELIVERY_REQUESTED',
    aggregateType: 'User',
    aggregateId: user.id,
    idempotencyKey: `EMAIL_VERIFICATION:${user.id}:${tokenHash}`, // unique per generated token
    payload: {
      userId: user.id,
      email: user.email,
    },
    jobsToCreate: [
      {
        channel: 'EMAIL',
        jobType: 'EMAIL_VERIFICATION',
        recipientReference: user.email,
        payload: {
          expiresInHours: config.emailVerification.tokenTtlHours,
        },
        secret: token,
        secretExpiresAt: expiresAt,
      }
    ]
  });
};

const sendMobileOtp = async (user, phone) => {
  // Use user's existing phone or the provided one
  const targetPhone = phone || user.phone;
  if (!targetPhone) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A mobile number is required to send OTP');
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  user.mobileOtp = otp;
  user.mobileOtpExpiresAt = expiresAt;
  
  // Update phone if it was newly provided
  if (phone && !user.phone) {
    user.phone = phone;
  }
  
  await user.save();

  // Mock SMS delivery for testing (would use Twilio/SNS in production)
  logger.info(`[MOCK SMS] Sending OTP ${otp} to ${targetPhone}`);
  
  return { otp, targetPhone }; // Returning OTP for development purposes
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
    userFields.address = payload.address;
    userFields.city = payload.city;
    userFields.state = payload.state;
    userFields.postalCode = payload.postalCode;
  }

  const user = await User.create(userFields);

  await issueVerificationEmail(user);

  // Trigger welcome notification
  const notificationService = require('../notifications/notification.service');
  const NotificationType = require('../../common/enums/notification-type.enum');
  await notificationService.createNotification({
    recipientId: user._id,
    type: NotificationType.ACCOUNT_CREATED,
    eventId: user._id.toString(),
  });

  return buildAuthPayload(user);
};

const login = async ({ email, password, role }) => {
  const user = await User.findOne({ email }).select('+password +refreshTokenHash +twoFactorSecret');

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Account not found. Please register.');
  }

  if (!(await comparePassword(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid password. Please try again.');
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User account is inactive');
  }

  if (role && user.role !== role) {
    if (user.role === UserRoles.ADMIN) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Administrators must log in via the Admin portal.');
    }
    if (role === UserRoles.CITIZEN) {
      throw new ApiError(httpStatus.FORBIDDEN, 'This email is registered as an Agent. Please select the Agent tab to log in.');
    }
    if (role === UserRoles.AGENT) {
      throw new ApiError(httpStatus.FORBIDDEN, 'This email is registered as a Citizen. Please select the Citizen tab to log in.');
    }
    throw new ApiError(httpStatus.FORBIDDEN, `Incorrect role selected. This account is registered as ${user.role}.`);
  }

  if (user.role === UserRoles.AGENT) {
    if (!user.emailVerified) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Email verification is required to access agent services.');
    }
    if (user.agentStatus === 'pending') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Your agent account application is pending administrator approval. Please wait for an administrator to review and approve your account.');
    }
    if (user.agentStatus === 'rejected') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Your agent account application was rejected.');
    }
    if (user.agentStatus === 'suspended') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Your agent account has been suspended.');
    }
  }

  if (user.role === UserRoles.ADMIN) {
    const tempToken = jwt.sign({ sub: user._id }, config.jwt.secret || 'temp_secret', { expiresIn: '5m' });
    
    if (!user.isTwoFactorEnabled) {
      const secretData = speakeasy.generateSecret({ name: `SevaSetu Admin (${user.email})` });
      const secret = secretData.base32;
      user.twoFactorSecret = secret;
      await user.save();
      
      const otpauth = secretData.otpauth_url;
      const qrCode = await qrcode.toDataURL(otpauth);
      
      return {
        requiresTwoFactorSetup: true,
        tempToken,
        qrCode,
        secret
      };
    }
    
    return {
      requiresTwoFactor: true,
      tempToken
    };
  }

  return buildAuthPayload(user);
};

const verifyTwoFactor = async ({ tempToken, totpToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, config.jwt.secret || 'temp_secret');
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired. Please log in again.');
  }

  const user = await User.findById(decoded.sub).select('+twoFactorSecret');
  if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA is not enabled for this user.');
  }

  const isValid = speakeasy.totp.verify({ token: totpToken, secret: user.twoFactorSecret, encoding: 'base32', window: 1 });
  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authentication code.');
  }

  return buildAuthPayload(user);
};

const setupTwoFactor = async ({ tempToken, totpToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, config.jwt.secret || 'temp_secret');
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired. Please log in again.');
  }

  const user = await User.findById(decoded.sub).select('+twoFactorSecret');
  if (!user || !user.twoFactorSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA setup was not initialized.');
  }

  const isValid = speakeasy.totp.verify({ token: totpToken, secret: user.twoFactorSecret, encoding: 'base32', window: 1 });
  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authentication code.');
  }

  user.isTwoFactorEnabled = true;
  await user.save();

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

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = expiresAt;
  await user.save();

  await jobService.enqueueOutboxEvent({
    eventType: 'PASSWORD_RESET_DELIVERY_REQUESTED',
    aggregateType: 'User',
    aggregateId: user.id,
    idempotencyKey: `PASSWORD_RESET:${user.id}:${tokenHash}`, // unique per reset token
    payload: {
      userId: user.id,
      email: user.email,
    },
    jobsToCreate: [
      {
        channel: 'EMAIL',
        jobType: 'PASSWORD_RESET',
        recipientReference: user.email,
        payload: {
          expiresInMinutes: config.passwordReset.tokenTtlMinutes,
        },
        secret: token,
        secretExpiresAt: expiresAt,
      }
    ]
  });

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
  login,
  verifyTwoFactor,
  setupTwoFactor,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  FORGOT_PASSWORD_MESSAGE,
  VERIFICATION_RESEND_MESSAGE,
  verifyEmail,
  resendVerificationEmail,
  logout,
  refreshAccessToken,
  register,
};
