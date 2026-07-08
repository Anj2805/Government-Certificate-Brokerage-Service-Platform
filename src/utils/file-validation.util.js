const fs = require('fs/promises');
const crypto = require('crypto');
const httpStatus = require('http-status');
const ApiError = require('../common/errors/api-error');

const MAGIC_BYTES = Object.freeze({
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
});

/**
 * Validates the file signature (magic bytes) against expected types.
 */
const validateFileSignature = async (filePath) => {
  let fileHandle;
  try {
    fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(8); // Max signature length we check
    await fileHandle.read(buffer, 0, 8, 0);

    const checkSignature = (signatureArray) => {
      for (let i = 0; i < signatureArray.length; i++) {
        if (buffer[i] !== signatureArray[i]) return false;
      }
      return true;
    };

    if (checkSignature(MAGIC_BYTES.pdf)) return 'application/pdf';
    if (checkSignature(MAGIC_BYTES.jpeg)) return 'image/jpeg';
    if (checkSignature(MAGIC_BYTES.png)) return 'image/png';

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file signature. File content does not match allowed types.');
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
};

/**
 * Computes a SHA-256 hash for the given file content.
 */
const computeFileHash = async (filePath) => {
  const hash = crypto.createHash('sha256');
  const stream = require('fs').createReadStream(filePath);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

module.exports = {
  validateFileSignature,
  computeFileHash,
};
