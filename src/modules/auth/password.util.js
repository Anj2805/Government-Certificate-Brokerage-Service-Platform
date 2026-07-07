const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = async (password, passwordHash) => bcrypt.compare(password, passwordHash);

module.exports = {
  comparePassword,
  hashPassword,
};
