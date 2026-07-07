const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const { toSafeUser } = require('./user.dto');
const userRepository = require('./user.repository');

const ALLOWED_PROFILE_FIELDS = ['firstName', 'lastName', 'phone'];

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

module.exports = {
  getMyProfile,
  updateMyProfile,
};
