const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    publicVerificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      unique: true, // One active certificate per application
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    serviceSnapshot: {
      serviceName: { type: String, required: true },
      category: { type: String, required: true },
    },
    holderDisplayName: {
      type: String,
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuerMetadata: {
      platformName: { type: String, default: 'SevaSetu Platform' },
      version: { type: String, default: '1.0' },
    },
    integrityHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    revocationReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model('Certificate', certificateSchema);
