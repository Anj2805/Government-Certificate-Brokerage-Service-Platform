const path = require('path');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = Object.freeze([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

module.exports = {
  allowedMimeTypes,
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  uploadDir: path.resolve(process.cwd(), 'uploads'),
};
