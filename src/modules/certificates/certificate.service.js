const crypto = require('crypto');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const Certificate = require('./certificate.model');
const Request = require('../requests/request.model');
const RequestStatus = require('../../common/enums/request-status.enum');
const User = require('../users/user.model');
const UserRoles = require('../../common/enums/user-roles.enum');
const logger = require('../../config/logger');

/**
 * Creates a deterministic, stringified representation of the certificate payload
 * for hashing. This ensures any tampering is detected.
 */
const getCanonicalPayload = (payload) => {
  // Sort keys to ensure deterministic order
  const ordered = {};
  Object.keys(payload).sort().forEach((key) => {
    ordered[key] = payload[key];
  });
  return JSON.stringify(ordered);
};

const generateIntegrityHash = (canonicalPayload) => {
  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
};

/**
 * Issues a certificate idempotently. If one already exists for this request, it returns it.
 */
const issueCertificate = async (requestId, reqId) => {
  // Check if certificate already exists
  let certificate = await Certificate.findOne({ request: requestId });
  if (certificate) {
    return certificate;
  }

  const request = await Request.findById(requestId).populate('citizen');
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  if (request.status !== RequestStatus.COMPLETED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Application must be approved before issuing a certificate');
  }

  const publicVerificationId = crypto.randomUUID();
  const holderDisplayName = `${request.citizen.firstName} ${request.citizen.lastName}`.trim();
  const issuedAt = new Date();
  
  const payloadData = {
    publicVerificationId,
    requestNumber: request.requestNumber,
    serviceName: request.serviceSnapshot.serviceName,
    holderDisplayName,
    issuedAt: issuedAt.toISOString(),
    issuerPlatform: 'SevaSetu Platform',
    version: '1.0',
  };

  const canonicalPayload = getCanonicalPayload(payloadData);
  const integrityHash = generateIntegrityHash(canonicalPayload);

  try {
    certificate = await Certificate.create({
      publicVerificationId,
      request: requestId,
      citizen: request.citizen._id,
      service: request.service,
      serviceSnapshot: {
        serviceName: request.serviceSnapshot.serviceName,
        category: request.serviceSnapshot.category,
      },
      holderDisplayName,
      issuedAt,
      integrityHash,
      status: 'ACTIVE',
    });

    logger.info({ audit: true, eventType: 'CERTIFICATE_ISSUED', requestId: reqId, applicationNumber: request.requestNumber, certificateId: certificate.publicVerificationId }, 'Certificate issued successfully');
    
    return certificate;
  } catch (error) {
    // Handle potential duplicate key error (race condition) idempotently
    if (error.code === 11000) {
      certificate = await Certificate.findOne({ request: requestId });
      if (certificate) return certificate;
    }
    throw error;
  }
};

/**
 * On-demand PDF generation. Streams directly to response.
 */
const generateCertificatePdfStream = (certificate) => {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Basic styling
  doc.fontSize(24).text('SevaSetu Platform', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18).text('CERTIFICATE OF ISSUANCE', { align: 'center', underline: true });
  doc.moveDown(2);
  
  doc.fontSize(14).text(`This is to certify that`);
  doc.moveDown();
  doc.fontSize(20).text(certificate.holderDisplayName, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`has been issued the following service:`);
  doc.moveDown();
  doc.fontSize(16).text(certificate.serviceSnapshot.serviceName, { align: 'center' });
  doc.moveDown(2);
  
  doc.fontSize(12).text(`Application Number: ${certificate.request.requestNumber || 'N/A'}`); // We might need to populate request
  doc.text(`Issued On: ${certificate.issuedAt.toISOString().split('T')[0]}`);
  doc.moveDown();
  doc.text(`Public Verification ID:`);
  doc.fontSize(10).text(certificate.publicVerificationId);
  doc.moveDown();
  doc.text(`Integrity Hash (SHA-256):`);
  doc.text(certificate.integrityHash);

  doc.end();
  return doc;
};

const downloadCertificate = async (certificateId, user) => {
  // Try finding by public ID or internal ID
  const isMongoId = mongoose.isValidObjectId(certificateId);
  const query = isMongoId ? { _id: certificateId } : { publicVerificationId: certificateId };
  
  const certificate = await Certificate.findOne(query).populate('request', 'requestNumber');
  
  if (!certificate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Certificate not found');
  }

  // Authorization Check
  if (user.role === UserRoles.CITIZEN && certificate.citizen.toString() !== user.id) {
    logger.warn({ audit: true, eventType: 'CERTIFICATE_DOWNLOAD_DENIED', actorId: user.id, certificateId: certificate.publicVerificationId }, 'Certificate download denied');
    throw new ApiError(httpStatus.NOT_FOUND, 'Certificate not found');
  }

  // Optionally check for agents if policy allows (here we restrict to Citizen/Admin or Assigned Agent)
  if (user.role === UserRoles.AGENT) {
    const request = await Request.findById(certificate.request._id);
    if (request.assignedAgent?.toString() !== user.id) {
      logger.warn({ audit: true, eventType: 'CERTIFICATE_DOWNLOAD_DENIED', actorId: user.id, certificateId: certificate.publicVerificationId }, 'Certificate download denied');
      throw new ApiError(httpStatus.NOT_FOUND, 'Certificate not found');
    }
  }

  if (certificate.status === 'REVOKED') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This certificate has been revoked');
  }

  return certificate;
};

const verifyPublicCertificate = async (publicVerificationId) => {
  const certificate = await Certificate.findOne({ publicVerificationId }).populate('request', 'requestNumber');
  
  if (!certificate) {
    // Unknown verification IDs must return safe deterministic semantics (e.g. valid: false)
    return { valid: false };
  }

  // Verify integrity hash
  const payloadData = {
    publicVerificationId: certificate.publicVerificationId,
    requestNumber: certificate.request.requestNumber,
    serviceName: certificate.serviceSnapshot.serviceName,
    holderDisplayName: certificate.holderDisplayName,
    issuedAt: certificate.issuedAt.toISOString(),
    issuerPlatform: 'SevaSetu Platform',
    version: '1.0',
  };

  const canonicalPayload = getCanonicalPayload(payloadData);
  const currentHash = generateIntegrityHash(canonicalPayload);
  
  const isValid = currentHash === certificate.integrityHash && certificate.status === 'ACTIVE';
  
  logger.info({ audit: true, eventType: isValid ? 'CERTIFICATE_VERIFIED' : 'CERTIFICATE_VERIFICATION_FAILED', certificateId: publicVerificationId }, 'Public certificate verified');

  return {
    valid: isValid,
    publicVerificationId: certificate.publicVerificationId,
    applicationNumber: certificate.request.requestNumber,
    serviceName: certificate.serviceSnapshot.serviceName,
    holderDisplayName: certificate.holderDisplayName,
    issuedAt: certificate.issuedAt,
    status: certificate.status,
    integrityVerified: currentHash === certificate.integrityHash,
  };
};

module.exports = {
  issueCertificate,
  generateCertificatePdfStream,
  downloadCertificate,
  verifyPublicCertificate,
  getCanonicalPayload,
  generateIntegrityHash,
};
