const { DeliveryJob, JobStatus } = require('../modules/jobs/delivery-job.model');
const { claimAvailableJobs } = require('../modules/jobs/job.service');
const emailService = require('../services/email.service');
const { decryptDeliverySecret } = require('../utils/crypto.util');
const config = require('../config');
const logger = require('../config/logger');

let isRunning = false;
let timeoutId = null;

const WORKER_ID = `worker-${process.pid}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Stop claiming new jobs
 */
const stop = () => {
  logger.info({ workerId: WORKER_ID }, 'Worker stopping');
  isRunning = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const processJob = async (job) => {
  try {
    // 1. Process payload
    let text = '';
    let subject = '';

    // If there's an encrypted secret and it hasn't expired, decrypt it
    let secret = null;
    if (job.encryptedSecret && job.encryptedSecret.ciphertext) {
      if (job.secretExpiresAt && new Date() > job.secretExpiresAt) {
        throw new Error('Secret has expired'); // Will be treated as permanent failure
      }
      secret = decryptDeliverySecret(
        job.encryptedSecret.ciphertext,
        job.encryptedSecret.iv,
        job.encryptedSecret.authTag
      );
    }

    if (job.jobType === 'EMAIL_VERIFICATION') {
      await emailService.sendEmailVerificationEmail({
        to: job.recipientReference,
        verificationUrl: `${config.frontend.url.replace(/\/$/, '')}/verify-email/${encodeURIComponent(secret)}`,
        expiresInHours: job.payload.expiresInHours,
      });
    } else if (job.jobType === 'PASSWORD_RESET') {
      await emailService.sendPasswordResetEmail({
        to: job.recipientReference,
        resetUrl: `${config.frontend.url.replace(/\/$/, '')}/reset-password/${encodeURIComponent(secret)}`,
        expiresInMinutes: job.payload.expiresInMinutes,
      });
    } else if (job.jobType === 'APPLICATION_NOTIFICATION') {
      await emailService.sendEmail({
        to: job.recipientReference,
        subject: job.payload.title || 'Notification',
        text: job.payload.message || '',
        providerIdempotencyKey: job.providerIdempotencyKey,
      });
    } else {
      throw new Error(`Unsupported jobType: ${job.jobType}`);
    }

    // 3. Mark as SUCCEEDED
    job.status = JobStatus.SUCCEEDED;
    job.completedAt = new Date();
    
    // As per requirement: clean up encrypted secret on success
    job.encryptedSecret = undefined;
    
    await job.save();

    logger.info({ audit: true, eventType: 'DELIVERY_JOB_SUCCEEDED', jobId: job._id, workerId: WORKER_ID }, 'Delivery job succeeded');

  } catch (error) {
    job.attemptCount += 1;
    job.lastAttemptAt = new Date();
    job.lastErrorCode = error.code || 'UNKNOWN';
    job.lastErrorMessageSafe = error.message;

    // Determine category: Transient or Permanent
    // Simulated delivery failure or timeouts can be transient. "Secret has expired" or "Unsupported" are permanent.
    const isPermanent = ['Secret has expired', 'Unsupported jobType'].some(e => error.message.includes(e));

    if (isPermanent || job.attemptCount >= job.maxAttempts) {
      job.status = JobStatus.DEAD_LETTER;
      job.deadLetteredAt = new Date();
      job.lastErrorCategory = 'PERMANENT';

      // Record server-controlled secretExpiresAt if not present. The job retains secret while valid.
      logger.error({ audit: true, eventType: 'DELIVERY_JOB_DEAD_LETTERED', jobId: job._id, workerId: WORKER_ID, err: error.message }, 'Delivery job dead-lettered');
    } else {
      job.status = JobStatus.RETRY_SCHEDULED;
      job.lastErrorCategory = 'TRANSIENT';
      
      // Calculate delay: min(maxDelay, baseDelay * 2^(attempt - 1)) + jitter
      const baseDelay = config.jobs.retryBaseDelayMs;
      const maxDelay = config.jobs.retryMaxDelayMs;
      const exponentialDelay = baseDelay * Math.pow(2, job.attemptCount - 1);
      const jitter = Math.floor(Math.random() * 1000); // 0-1000ms jitter
      
      const delayMs = Math.min(maxDelay, exponentialDelay) + jitter;
      job.availableAt = new Date(Date.now() + delayMs);
    }
    
    // Clear lock
    job.lockedBy = null;
    job.lockedAt = null;
    job.leaseExpiresAt = null;

    await job.save();
  }
};

/**
 * Run a single polling iteration
 */
const runOnce = async () => {
  try {
    const jobs = await claimAvailableJobs(WORKER_ID, config.worker.concurrency);
    
    if (jobs.length > 0) {
      // Process concurrently
      await Promise.all(jobs.map(job => processJob(job)));
      return true; // Had jobs
    }
  } catch (error) {
    logger.error({ err: error, workerId: WORKER_ID }, 'Error in worker polling loop');
  }
  return false; // No jobs
};

const poll = async () => {
  if (!isRunning) return;

  const hadJobs = await runOnce();

  // If had jobs, poll again immediately to clear backlog. Else wait.
  const delay = hadJobs ? 100 : config.worker.pollIntervalMs;
  
  if (isRunning) {
    timeoutId = setTimeout(poll, delay);
  }
};

const start = () => {
  if (isRunning) return;
  isRunning = true;
  logger.info({ workerId: WORKER_ID }, 'Delivery worker started');
  poll();
};

module.exports = {
  start,
  stop,
  runOnce,
};
