const mongoose = require('mongoose');
const DocumentStatus = require('../../common/enums/document-status.enum');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 80,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    path: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDING,
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hash: {
      type: String,
      required: true,
      index: true,
    },
    isSuperseded: {
      type: Boolean,
      default: false,
      index: true,
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    replacedAt: {
      type: Date,
    },
    reviewHistory: [
      {
        status: { type: String, enum: Object.values(DocumentStatus), required: true },
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, maxlength: 500 },
        reviewedAt: { type: Date, default: Date.now },
      }
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: '__v',
    toJSON: {
      transform(_doc, ret) {
        delete ret.path;
        delete ret.hash;
        return ret;
      },
    },
  },
);

documentSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    this.increment();
  }
  next();
});

documentSchema.index({ ownerUser: 1, deletedAt: 1, createdAt: -1 });
documentSchema.index({ assignedAgent: 1, deletedAt: 1, createdAt: -1 });
documentSchema.index({ status: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
