const mongoose = require('mongoose');
const RequestStatus = require('../../common/enums/request-status.enum');
const DeliveryStatus = require('../../common/enums/delivery-status.enum');
const PaymentStatus = require('../../common/enums/payment-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: {
      type: String,
      enum: Object.values(RequestStatus),
    },
    toStatus: {
      type: String,
      enum: Object.values(RequestStatus),
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedByRole: {
      type: String,
      enum: Object.values(UserRoles),
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const requestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      index: true,
    },
    applicantSnapshot: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
    },
    serviceSnapshot: {
      serviceName: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      estimatedProcessingDays: {
        type: Number,
        required: true,
      },
      serviceCharge: {
        type: Number,
        required: true,
      },
      requiredDocuments: {
        type: [String],
        default: [],
      },
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.DRAFT,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.NOT_REQUIRED,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH_ON_DELIVERY'],
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.NOT_REQUIRED,
      index: true,
    },
    trackingId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    deliveryAddress: {
      recipientName: { type: String },
      mobileNumber: { type: String },
      alternateMobile: { type: String },
      houseNumber: { type: String },
      street: { type: String },
      landmark: { type: String },
      village: { type: String },
      district: { type: String },
      state: { type: String },
      pinCode: { type: String },
      addressType: { type: String, enum: ['Home', 'Work', 'Other'] },
      deliveryInstructions: { type: String },
    },
    deliveryDeclarationAccepted: {
      type: Boolean,
      default: false,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    applicationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    submittedAt: {
      type: Date,
    },
    assignedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: '__v',
    optimisticConcurrency: true,
  },
);

requestSchema.index({ citizen: 1, status: 1, createdAt: -1 });
requestSchema.index({ assignedAgent: 1, status: 1, createdAt: -1 });
requestSchema.index({ service: 1, status: 1 });

requestSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    this.increment();
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);
