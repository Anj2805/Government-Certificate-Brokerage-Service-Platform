const { param } = require('express-validator');

const downloadCertificate = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('id is required (can be internal MongoDB ObjectId or publicVerificationId)'),
];

const verifyPublicCertificate = [
  param('publicVerificationId')
    .trim()
    .notEmpty()
    .withMessage('publicVerificationId is required'),
];

module.exports = {
  downloadCertificate,
  verifyPublicCertificate,
};
