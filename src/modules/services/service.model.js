const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 80,
      index: true,
    },
    requiredDocuments: {
      type: [String],
      required: true,
      validate: {
        validator(documents) {
          return Array.isArray(documents) && documents.length > 0;
        },
        message: 'At least one required document is required',
      },
    },
    estimatedProcessingDays: {
      type: Number,
      required: true,
      min: 1,
    },
    serviceCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    requiresIdVerification: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

serviceSchema.virtual('estimatedTime')
  .get(function getEstimatedTime() {
    return this.estimatedProcessingDays;
  })
  .set(function setEstimatedTime(value) {
    this.estimatedProcessingDays = value;
  });

serviceSchema.index({ name: 'text', description: 'text', category: 'text' });
serviceSchema.index(
  { name: 1, category: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);

module.exports = mongoose.model('Service', serviceSchema);
