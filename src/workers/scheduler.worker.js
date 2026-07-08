const Request = require('../modules/requests/request.model');
const { DeliveryJob, JobStatus } = require('../modules/jobs/delivery-job.model');
const jobService = require('../modules/jobs/job.service');
const RequestStatus = require('../common/enums/request-status.enum');
const config = require('../config');
const logger = require('../config/logger');

let isRunning = false;
let timeoutId = null;

const stop = () => {
  logger.info('Scheduler stopping');
  isRunning = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const runRemindersScan = async () => {
  try {
    const daysAgo = config.scheduler.correctionReminderAfterDays;
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Find requests stuck in DOCUMENTS_REQUIRED state
    // For idempotency, we'll use the date bucket, e.g., 'YYYY-MM-DD'
    const todayStr = new Date().toISOString().split('T')[0];

    const eligibleRequests = await Request.find({
      status: RequestStatus.DOCUMENTS_REQUIRED,
      updatedAt: { $lt: cutoffDate }
    }).limit(config.scheduler.batchSize).populate('citizenUser');

    for (const req of eligibleRequests) {
      if (!req.citizenUser || !req.citizenUser.email) continue;

      const idempotencyKey = `APPLICATION_REMINDER:${req._id}:DOCUMENTS_REQUIRED:${todayStr}`;

      try {
        await jobService.enqueueOutboxEvent({
          eventType: 'APPLICATION_REMINDER_SCHEDULED',
          aggregateType: 'Request',
          aggregateId: req._id,
          idempotencyKey,
          payload: {
            requestId: req._id,
            reminderType: 'CORRECTION_NEEDED',
            daysPending: daysAgo,
          },
          jobsToCreate: [
            {
              channel: 'EMAIL',
              jobType: 'APPLICATION_NOTIFICATION',
              recipientReference: req.citizenUser.email,
              payload: {
                title: 'Reminder: Action Required on Your Application',
                message: `Your application ${req.applicationNumber} has been waiting for additional documents for over ${daysAgo} days. Please upload them to continue processing.`,
                type: 'REMINDER',
              }
            }
          ]
        });
      } catch (error) {
        if (error.code !== 11000) {
          logger.error({ err: error, requestId: req._id }, 'Failed to enqueue reminder');
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Error in scheduler reminder scan');
  }
};

const runDeadLetterCleanup = async () => {
  try {
    // Find Dead-Letter jobs with expired secretExpiresAt
    // and cryptographically erase the secret
    const now = new Date();
    const result = await DeliveryJob.updateMany(
      {
        status: JobStatus.DEAD_LETTER,
        secretExpiresAt: { $lte: now },
        'encryptedSecret.ciphertext': { $exists: true }
      },
      {
        $unset: { encryptedSecret: 1 }
      }
    );
    if (result.modifiedCount > 0) {
      logger.info({ modifiedCount: result.modifiedCount }, 'Cleaned expired delivery secrets from dead letters');
    }
  } catch (error) {
    logger.error({ err: error }, 'Error in dead letter cleanup scan');
  }
};

const runOnce = async () => {
  await runRemindersScan();
  await runDeadLetterCleanup();
};

const poll = async () => {
  if (!isRunning) return;

  await runOnce();

  if (isRunning) {
    timeoutId = setTimeout(poll, config.scheduler.scanIntervalMs);
  }
};

const start = () => {
  if (isRunning) return;
  isRunning = true;
  logger.info('Scheduler started');
  poll();
};

module.exports = {
  start,
  stop,
  runOnce,
};
