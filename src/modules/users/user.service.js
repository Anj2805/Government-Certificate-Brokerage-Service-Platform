const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const { toSafeUser } = require('./user.dto');
const userRepository = require('./user.repository');

const storageService = require('../../services/storage.service');

const ALLOWED_PROFILE_FIELDS = [
  'firstName', 'lastName', 'phone', 
  'address', 'city', 'state', 'postalCode', 
  'preferredLanguage', 'languagesSupported'
];

const getMyProfile = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authenticated user was not found');
  }

  return toSafeUser(user);
};

const updateMyProfile = async (userId, payload) => {
  const user = await userRepository.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authenticated user was not found');
  }

  const updates = {};
  ALLOWED_PROFILE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates[field] = payload[field];
    }
  });

  Object.assign(user, updates);
  const savedUser = await userRepository.save(user);

  return toSafeUser(savedUser);
};

const uploadProfilePhoto = async (userId, file) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
  }

  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const oldPhotoKey = user.profilePhoto;
  const extension = require('path').extname(file.originalname);
  const storageKey = await storageService.save(file.path, extension);

  user.profilePhoto = storageKey;
  await userRepository.save(user);

  if (oldPhotoKey) {
    await storageService.delete(oldPhotoKey).catch(() => {});
  }

  return toSafeUser(user);
};

const removeProfilePhoto = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.profilePhoto) {
    await storageService.delete(user.profilePhoto).catch(() => {});
    user.profilePhoto = null;
    await userRepository.save(user);
  }

  return toSafeUser(user);
};

const getProfilePhotoStrategy = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive || !user.profilePhoto) {
    return null;
  }
  return await storageService.getViewStrategy(user.profilePhoto);
};

const uploadIdProof = async (userId, payload, file) => {
  if (!file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
  if (!payload.idProofType) throw new ApiError(httpStatus.BAD_REQUEST, 'idProofType is required');

  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const documentService = require('../documents/document.service');
  const doc = await documentService.uploadDocument({
    file,
    payload: {
      documentType: payload.idProofType,
      title: 'ID Proof Document',
    },
    user,
    reqId: 'upload-id-proof',
  });

  user.idProofDocument = doc._id || doc.id;
  user.idProofType = payload.idProofType;
  user.idProofStatus = 'pending';
  user.idProofRejectionReason = undefined;

  await userRepository.save(user);

  return toSafeUser(user);
};

const verifyIdProof = async (userId, payload, adminUser) => {
  const { status, reason } = payload;
  if (!['verified', 'rejected'].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Status must be verified or rejected');
  }

  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  if (user.idProofStatus !== 'pending') throw new ApiError(httpStatus.BAD_REQUEST, 'User ID proof is not pending verification');

  user.idProofStatus = status;
  user.idProofVerifiedBy = adminUser.id;
  user.idProofVerifiedAt = new Date();
  
  if (status === 'rejected') {
    if (!reason) throw new ApiError(httpStatus.BAD_REQUEST, 'Rejection reason is required');
    user.idProofRejectionReason = reason;
  } else {
    user.idProofRejectionReason = undefined;
  }

  await userRepository.save(user);

  const notificationService = require('../notifications/notification.service');
  const NotificationType = require('../../common/enums/notification-type.enum');
  await notificationService.createNotification({
    recipientId: user.id,
    type: status === 'verified' ? NotificationType.ID_PROOF_VERIFIED : NotificationType.ID_PROOF_REJECTED,
    eventId: Date.now().toString(),
  }).catch((err) => {
    require('../../config/logger').error({ err }, 'Failed to send ID proof notification');
  });

  return toSafeUser(user);
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getProfilePhotoStrategy,
  uploadIdProof,
  verifyIdProof,
};
