const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const multer = require('multer');
const ApiError = require('../common/errors/api-error');
const uploadConfig = require('../config/upload');

fs.mkdirSync(uploadConfig.uploadDir, { recursive: true });

const extensionByMimeType = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
});

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadConfig.uploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype] || path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const fileFilter = (_req, file, callback) => {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    return callback(new ApiError(httpStatus.BAD_REQUEST, 'Only PDF, JPG, JPEG, and PNG files are allowed'));
  }

  return callback(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: uploadConfig.maxFileSizeBytes,
    files: 1,
  },
});

const normalizeMulterError = (error) => {
  if (!error) return null;

  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new ApiError(httpStatus.BAD_REQUEST, 'File size must not exceed 5MB');
    }

    return new ApiError(httpStatus.BAD_REQUEST, error.message);
  }

  return error;
};

const uploadSingleDocument = (fieldName = 'document') => (req, res, next) => {
  multerUpload.single(fieldName)(req, res, (error) => {
    const normalizedError = normalizeMulterError(error);

    if (normalizedError) {
      return next(normalizedError);
    }

    if (!req.file) {
      return next(new ApiError(httpStatus.BAD_REQUEST, `${fieldName} file is required`));
    }

    return next();
  });
};

module.exports = {
  uploadSingleDocument,
};
