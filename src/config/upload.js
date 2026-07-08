const path = require('path');

const MAX_FILE_SIZE_BYTES = process.env.UPLOAD_MAX_FILE_SIZE_BYTES ? parseInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES, 10) : 5 * 1024 * 1024;
const MAX_FILES_PER_APPLICATION = process.env.UPLOAD_MAX_FILES_PER_APPLICATION ? parseInt(process.env.UPLOAD_MAX_FILES_PER_APPLICATION, 10) : 10;
const STORAGE_ROOT = process.env.STORAGE_ROOT || path.resolve(process.cwd(), 'storage');

const allowedMimeTypes = Object.freeze([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

module.exports = {
  allowedMimeTypes,
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  maxFilesPerApplication: MAX_FILES_PER_APPLICATION,
  uploadDir: path.resolve(process.cwd(), 'uploads'), // Used for temp multer uploads
  storageRoot: path.resolve(STORAGE_ROOT), // Used for final persistent storage
};
