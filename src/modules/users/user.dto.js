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
    
    // Profile Fields
    ...(plainUser.profilePhoto ? { profilePhoto: plainUser.profilePhoto } : {}),
    ...(plainUser.address ? { address: plainUser.address } : {}),
    ...(plainUser.city ? { city: plainUser.city } : {}),
    ...(plainUser.state ? { state: plainUser.state } : {}),
    ...(plainUser.postalCode ? { postalCode: plainUser.postalCode } : {}),
    ...(plainUser.preferredLanguage ? { preferredLanguage: plainUser.preferredLanguage } : {}),
    ...(plainUser.languagesSupported ? { languagesSupported: plainUser.languagesSupported } : {}),
    ...(plainUser.designation ? { designation: plainUser.designation } : {}),
    ...(plainUser.department ? { department: plainUser.department } : {}),
    ...(plainUser.serviceSpecialization ? { serviceSpecialization: plainUser.serviceSpecialization } : {}),
    ...(plainUser.agentIdentifier ? { agentIdentifier: plainUser.agentIdentifier } : {}),
    
    // ID Verification Fields
    ...(plainUser.idProofStatus ? { idProofStatus: plainUser.idProofStatus } : {}),
    ...(plainUser.idProofType ? { idProofType: plainUser.idProofType } : {}),
    ...(plainUser.idProofDocument ? { idProofDocument: plainUser.idProofDocument } : {}),
    ...(plainUser.idProofRejectionReason ? { idProofRejectionReason: plainUser.idProofRejectionReason } : {}),

    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
  };
};

module.exports = {
  toSafeUser,
};
