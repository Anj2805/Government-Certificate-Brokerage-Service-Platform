const { OutboxEvent, EventStatus } = require('./outbox-event.model');
const { DeliveryJob, JobStatus } = require('./delivery-job.model');
const { encryptDeliverySecret } = require('../../utils/crypto.util');
const config = require('../../config');
const logger = require('../../config/logger');

/**
 * Enqueue a single outbox event, and immediately generate delivery jobs for it.
 * Using transactional outbox if MongoDB supports replica sets (transactions).
 * If no transactions, fallback to idempotent creation.
 */
const enqueueOutboxEvent = async ({
  eventType,
  aggregateType,
  aggregateId,
  correlationId,
  idempotencyKey,
  payload,
  jobsToCreate = [], // array of { channel, jobType, recipientReference, payload, secret, secretExpiresAt }
}) => {
  // Use a Mongoose session if replica set is active. Here we assume we might not have a reliable replica set in local tests,
  // so we'll do at-least-once creation and rely on uniqueness for idempotency.
  
  let outboxEvent;
  try {
    outboxEvent = await OutboxEvent.create({
      eventType,
      aggregateType,
      aggregateId,
      correlationId,
      idempotencyKey,
      payload,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate idempotencyKey - find the existing one
      outboxEvent = await OutboxEvent.findOne({ idempotencyKey });
    } else {
      throw error;
    }
  }

  // Create jobs
  for (const jobDef of jobsToCreate) {
    const providerIdempotencyKey = `${jobDef.channel}:${jobDef.jobType}:${idempotencyKey}`;
    
    let encryptedSecret = null;
    if (jobDef.secret) {
      encryptedSecret = encryptDeliverySecret(jobDef.secret);
    }

    try {
      await DeliveryJob.create({
        outboxEvent: outboxEvent._id,
        channel: jobDef.channel,
        jobType: jobDef.jobType,
        providerIdempotencyKey,
        recipientReference: jobDef.recipientReference,
        payload: jobDef.payload || {},
        encryptedSecret,
        secretExpiresAt: jobDef.secretExpiresAt,
        maxAttempts: config.jobs.maxAttempts,
      });
    } catch (jobError) {
      if (jobError.code === 11000) {
        // Safe, job already exists for this providerIdempotencyKey
        continue;
      }
      throw jobError;
    }
  }

  // Mark outbox event as PROCESSED since jobs have durably fanned out
  outboxEvent.status = EventStatus.PROCESSED;
  outboxEvent.processedAt = new Date();
  await outboxEvent.save();

  logger.info({ audit: true, eventType: 'OUTBOX_EVENT_CREATED', eventId: outboxEvent._id, idempotencyKey }, 'Outbox event and jobs durably created');

  return outboxEvent;
};

/**
 * Claim available jobs
 */
const claimAvailableJobs = async (workerId, maxJobs) => {
  const now = new Date();
  
  // Find jobs that are:
  // 1. PENDING or RETRY_SCHEDULED
  // 2. availableAt <= now
  // 3. leaseExpiresAt <= now (stale leases) OR no active lease
  const query = {
    status: { $in: [JobStatus.PENDING, JobStatus.RETRY_SCHEDULED, JobStatus.PROCESSING] },
    availableAt: { $lte: now },
    $or: [
      { leaseExpiresAt: { $lte: now } },
      { leaseExpiresAt: null },
      { leaseExpiresAt: { $exists: false } }
    ]
  };

  const claimedJobs = [];
  
  // We use findOneAndUpdate in a loop to claim jobs atomically.
  // Because MongoDB findOneAndUpdate returns a single document.
  for (let i = 0; i < maxJobs; i++) {
    const leaseExpiresAt = new Date(now.getTime() + config.worker.leaseMs);
    const job = await DeliveryJob.findOneAndUpdate(
      query,
      {
        $set: {
          status: JobStatus.PROCESSING,
          lockedAt: now,
          lockedBy: workerId,
          leaseExpiresAt,
        }
      },
      { sort: { availableAt: 1 }, new: true }
    );

    if (!job) {
      break; // No more jobs available
    }

    claimedJobs.push(job);
  }

  return claimedJobs;
};

module.exports = {
  enqueueOutboxEvent,
  claimAvailableJobs,
};
