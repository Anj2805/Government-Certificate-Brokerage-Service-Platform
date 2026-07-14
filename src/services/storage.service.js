const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const uploadConfig = require('../config/upload');
const logger = require('../config/logger');
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Ensure storage root exists synchronously or on first load
const storageRoot = uploadConfig.storageRoot;

const provider = process.env.STORAGE_PROVIDER || 'local';

let s3Client = null;
if (provider === 's3') {
  s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
}

const initializeStorage = async () => {
  if (provider === 'local') {
    try {
      await fs.mkdir(storageRoot, { recursive: true });
      logger.info(`Storage root initialized at ${storageRoot}`);
    } catch (error) {
      logger.fatal({ err: error }, 'Failed to initialize storage root');
      throw error;
    }
  }
};

let storageInitialization = null;

const ensureStorageInitialized = async () => {
  if (provider !== 'local') return;

  if (!storageInitialization) {
    storageInitialization = initializeStorage();
  }

  await storageInitialization;
};

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

  if (provider === 'local') {
    await ensureStorageInitialized();
    const finalPath = getSafePath(storageKey);
    try {
      await fs.rename(tempFilePath, finalPath);
    } catch (error) {
      if (error.code === 'EXDEV') {
        await fs.copyFile(tempFilePath, finalPath);
        await fs.unlink(tempFilePath).catch(() => {});
      } else {
        throw error;
      }
    }
  } else if (provider === 's3') {
    const fileBuffer = await fs.readFile(tempFilePath);
    const ext = require('path').extname(storageKey).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.pdf') contentType = 'application/pdf';

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: contentType
    });
    await s3Client.send(command);
    await fs.unlink(tempFilePath).catch(() => {});
  }

  return storageKey;
};

/**
 * Checks if a file exists in persistent storage.
 */
const exists = async (storageKey) => {
  if (provider === 'local') {
    await ensureStorageInitialized();
    try {
      const filePath = getSafePath(storageKey);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  } else if (provider === 's3') {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
};

/**
 * Deletes a file from persistent storage.
 * Does not throw if the file is already missing.
 */
const remove = async (storageKey) => {
  if (provider === 'local') {
    await ensureStorageInitialized();
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
  } else if (provider === 's3') {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      logger.error({ err: error, storageKey }, 'Failed to delete file from S3');
      throw error;
    }
  }
};

/**
 * Retrieves the absolute physical path for a storage key.
 * IMPORTANT: This should ONLY be used for passing to internal APIs like res.download()
 * or content signature validators. It MUST NOT be exposed in API responses.
 */
const getDownloadStrategy = async (storageKey, originalName) => {
  if (provider === 'local') {
    await ensureStorageInitialized();
    return {
      type: 'local',
      physicalPath: getSafePath(storageKey)
    };
  } else if (provider === 's3') {
    const command = new HeadObjectCommand({ // We actually need GetObjectCommand for presigning, wait!
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${originalName}"`
    });
    // Let's fix this import above or just require it here
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${originalName}"`
    });

    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    return {
      type: 'redirect',
      url
    };
  }
};

const getViewStrategy = async (storageKey) => {
  if (provider === 'local') {
    await ensureStorageInitialized();
    return {
      type: 'local',
      physicalPath: getSafePath(storageKey)
    };
  } else if (provider === 's3') {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const ext = require('path').extname(storageKey).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.pdf') contentType = 'application/pdf';

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
      ResponseContentDisposition: 'inline',
      ResponseContentType: contentType
    });

    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    return {
      type: 'redirect',
      url
    };
  }
};

module.exports = {
  save,
  exists,
  delete: remove,
  getDownloadStrategy,
  getViewStrategy,
  generateStorageKey,
};
