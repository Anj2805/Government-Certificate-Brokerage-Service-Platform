const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const uploadConfig = require('../config/upload');
const logger = require('../config/logger');

// Ensure storage root exists synchronously or on first load
const storageRoot = uploadConfig.storageRoot;

const initializeStorage = async () => {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    logger.info(`Storage root initialized at ${storageRoot}`);
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to initialize storage root');
    throw error;
  }
};

// Initialize immediately (non-blocking for module load, but will complete quickly)
initializeStorage().catch(() => process.exit(1));

/**
 * Validates that a resolved path is strictly within the storage root
 * to prevent path traversal attacks.
 */
const getSafePath = (storageKey) => {
  if (!storageKey || typeof storageKey !== 'string') {
    throw new Error('Invalid storage key');
  }

  // Prevent directory traversal sequences in the key itself
  if (storageKey.includes('..') || storageKey.includes('/')) {
    throw new Error('Storage key contains invalid characters');
  }

  const resolvedPath = path.join(storageRoot, storageKey);
  const normalizedRoot = path.normalize(storageRoot);

  if (!resolvedPath.startsWith(normalizedRoot)) {
    throw new Error('Path traversal detected');
  }

  return resolvedPath;
};

/**
 * Generate a cryptographically strong unique storage key.
 */
const generateStorageKey = (extension = '') => {
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  const cleanExtension = extension.toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `${timestamp}-${uuid}${cleanExtension}`;
};

/**
 * Saves a file to persistent storage by moving it from a temporary location.
 * Uses atomic rename/move if on same device, otherwise falls back to copy+delete.
 */
const save = async (tempFilePath, extension = '') => {
  const storageKey = generateStorageKey(extension);
  const finalPath = getSafePath(storageKey);

  try {
    // Attempt atomic rename first (works if temp and storage are on the same filesystem)
    await fs.rename(tempFilePath, finalPath);
  } catch (error) {
    if (error.code === 'EXDEV') {
      // Cross-device link not permitted, fallback to copy + delete
      await fs.copyFile(tempFilePath, finalPath);
      await fs.unlink(tempFilePath).catch(() => {}); // Ignore cleanup error
    } else {
      throw error;
    }
  }

  return storageKey;
};

/**
 * Checks if a file exists in persistent storage.
 */
const exists = async (storageKey) => {
  try {
    const filePath = getSafePath(storageKey);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Deletes a file from persistent storage.
 * Does not throw if the file is already missing.
 */
const remove = async (storageKey) => {
  try {
    const filePath = getSafePath(storageKey);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true; // Already gone
    }
    logger.error({ err: error, storageKey }, 'Failed to delete file from storage');
    throw error;
  }
};

/**
 * Retrieves the absolute physical path for a storage key.
 * IMPORTANT: This should ONLY be used for passing to internal APIs like res.download()
 * or content signature validators. It MUST NOT be exposed in API responses.
 */
const getPhysicalPath = (storageKey) => {
  return getSafePath(storageKey);
};

module.exports = {
  save,
  exists,
  delete: remove,
  getPhysicalPath,
  generateStorageKey,
};
