const mongoose = require('mongoose');
const AgentStatus = require('../../common/enums/agent-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      sparse: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRoles),
      default: UserRoles.CITIZEN,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    agentStatus: {
      type: String,
      enum: Object.values(AgentStatus),
      default: undefined,
      index: true,
    },
    agentReviewedAt: {
      type: Date,
    },
    agentReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    agentRejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpiresAt;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpiresAt;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, agentStatus: 1 });

module.exports = mongoose.model('User', userSchema);
