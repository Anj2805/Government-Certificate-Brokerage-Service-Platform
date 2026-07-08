const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param {string} plaintext
 * @returns {object} { ciphertext, iv, authTag } (all hex strings)
 */
const encryptDeliverySecret = (plaintext) => {
  if (!plaintext) return null;

  const keyString = config.encryption.deliverySecretKey;
  if (!keyString || keyString.length < 32) {
    throw new Error('Invalid DELIVERY_SECRET_ENCRYPTION_KEY: must be at least 32 characters');
  }
  
  // Use first 32 bytes of the key string
  const key = Buffer.from(keyString.slice(0, 32), 'utf-8');
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag,
  };
};

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * @param {string} ciphertext (hex)
 * @param {string} ivHex (hex)
 * @param {string} authTagHex (hex)
 * @returns {string} plaintext
 */
const decryptDeliverySecret = (ciphertext, ivHex, authTagHex) => {
  if (!ciphertext || !ivHex || !authTagHex) return null;

  const keyString = config.encryption.deliverySecretKey;
  const key = Buffer.from(keyString.slice(0, 32), 'utf-8');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
};

module.exports = {
  encryptDeliverySecret,
  decryptDeliverySecret,
};
