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
    // Agent Profile Fields (Editable by Agent)
    profilePhoto: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    preferredLanguage: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'English',
    },
    languagesSupported: {
      type: [String],
      default: [],
    },
    // Agent Profile Fields (Admin-managed / Read-only for Agent)
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    serviceSpecialization: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    agentIdentifier: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: 50,
    },
    agentBackground: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    lastLoginAt: {
      type: Date,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    // ID Verification Fields (Citizen)
    idProofStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
      index: true,
    },
    idProofType: {
      type: String,
      enum: ['Aadhar', 'PAN', 'Voter ID', 'College ID', 'Passport', 'Driving License', 'Other'],
    },
    idProofDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    idProofVerifiedAt: {
      type: Date,
    },
    idProofVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    idProofRejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
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
        delete ret.twoFactorSecret;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, agentStatus: 1 });

module.exports = mongoose.model('User', userSchema);
