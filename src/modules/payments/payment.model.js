const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
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
    },
    paymentType: {
      type: String,
      enum: ['OFFLINE', 'ONLINE', 'CASH_ON_DELIVERY'],
      default: 'OFFLINE',
    },
    paymentMethod: {
      type: String,
      enum: ['SERVICE_CENTER', 'GATEWAY', 'CASH'],
      default: 'SERVICE_CENTER',
    },
    status: {
      type: String,
      enum: ['DUE', 'PAID', 'WAIVED', 'REFUND_PENDING', 'REFUNDED', 'COD_DUE'],
      default: 'DUE',
      index: true,
    },
    amountDue: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    serviceCenterId: {
      type: String,
    },
    preferredVisitDate: {
      type: Date,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    collectionMethod: {
      type: String,
      enum: ['Cash', 'UPI at Counter', 'Card at Counter', 'Other'],
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    collectedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
