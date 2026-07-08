const mongoose = require('mongoose');

const JobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  RETRY_SCHEDULED: 'RETRY_SCHEDULED',
  SUCCEEDED: 'SUCCEEDED',
  DEAD_LETTER: 'DEAD_LETTER',
};

const deliveryJobSchema = new mongoose.Schema(
  {
    outboxEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OutboxEvent',
      required: true,
    },
    channel: {
      type: String, // e.g. 'EMAIL'
      required: true,
    },
    jobType: {
      type: String, // e.g. 'PASSWORD_RESET', 'APPLICATION_REMINDER'
      required: true,
    },
    providerIdempotencyKey: {
      type: String,
      required: true,
      unique: true, // Prevents sending identical job details twice over provider
    },
    recipientReference: {
      type: String, // Safe email address
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Encrypted secret fields
    encryptedSecret: {
      ciphertext: String,
      iv: String,
      authTag: String,
    },
    secretExpiresAt: {
      type: Date, // Beyond this, replay fails and ciphertext is purged
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      required: true,
    },
    availableAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lockedAt: {
      type: Date,
    },
    lockedBy: {
      type: String, // Worker ID
    },
    leaseExpiresAt: {
      type: Date,
      index: true,
    },
    lastAttemptAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    deadLetteredAt: {
      type: Date,
    },
    lastErrorCode: {
      type: String,
    },
    lastErrorCategory: {
      type: String,
    },
    lastErrorMessageSafe: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes to quickly find eligible jobs
deliveryJobSchema.index({ status: 1, availableAt: 1, leaseExpiresAt: 1 });

module.exports = {
  JobStatus,
  DeliveryJob: mongoose.model('DeliveryJob', deliveryJobSchema),
};
