const User = require('./user.model');

const findById = (userId, projection) => User.findById(userId).select(projection || '');

const save = (user) => user.save();

module.exports = {
  findById,
  save,
};
