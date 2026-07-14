const path = require('path');
const os = require('os');

const MAX_FILE_SIZE_BYTES = process.env.UPLOAD_MAX_FILE_SIZE_BYTES ? parseInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES, 10) : 5 * 1024 * 1024;
const MAX_FILES_PER_APPLICATION = process.env.UPLOAD_MAX_FILES_PER_APPLICATION ? parseInt(process.env.UPLOAD_MAX_FILES_PER_APPLICATION, 10) : 10;
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const runtimeRoot = isServerless ? os.tmpdir() : process.cwd();
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(runtimeRoot, 'uploads');
const STORAGE_ROOT = process.env.STORAGE_ROOT || path.resolve(runtimeRoot, 'storage');

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
  uploadDir: path.resolve(UPLOAD_DIR), // Used for temp multer uploads
  storageRoot: path.resolve(STORAGE_ROOT), // Used for final persistent storage
};
