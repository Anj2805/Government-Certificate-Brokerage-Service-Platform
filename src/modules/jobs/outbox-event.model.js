const mongoose = require('mongoose');

const EventStatus = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
};

const outboxEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
    },
    aggregateId: {
      type: String,
      required: true,
    },
    correlationId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate events
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.PENDING,
      index: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = {
  EventStatus,
  OutboxEvent: mongoose.model('OutboxEvent', outboxEventSchema),
};
