const toSafeUser = (user) => {
  const plainUser = user?.toObject ? user.toObject() : { ...user };

  delete plainUser.password;
  delete plainUser.refreshTokenHash;
  delete plainUser.passwordResetTokenHash;
  delete plainUser.passwordResetExpiresAt;
  delete plainUser.emailVerificationTokenHash;
  delete plainUser.emailVerificationExpiresAt;

  return {
    id: plainUser._id?.toString?.() || plainUser.id,
    _id: plainUser._id?.toString?.() || plainUser.id,
    firstName: plainUser.firstName,
    lastName: plainUser.lastName,
    email: plainUser.email,
    phone: plainUser.phone,
    role: plainUser.role,
    isActive: plainUser.isActive,
    emailVerified: plainUser.emailVerified ?? false,
    ...(plainUser.emailVerifiedAt ? { emailVerifiedAt: plainUser.emailVerifiedAt } : {}),
    ...(plainUser.agentStatus ? { agentStatus: plainUser.agentStatus } : {}),
    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
  };
};

module.exports = {
  toSafeUser,
};
