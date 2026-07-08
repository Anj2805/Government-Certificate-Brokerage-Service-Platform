const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const DocumentStatus = require('../../common/enums/document-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const documentRepository = require('./document.repository');
const storageService = require('../../services/storage.service');
const fileValidation = require('../../utils/file-validation.util');
const uploadConfig = require('../../config/upload');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const deleteLocalFile = async (filePath) => {
  if (!filePath) return;
  const fs = require('fs/promises');
  await fs.unlink(filePath).catch(() => {});
};

const buildAccessQuery = async (user) => {
  if (user.role === UserRoles.ADMIN) {
    return {};
  }

  if (user.role === UserRoles.AGENT) {
    const Request = require('../requests/request.model');
    const requests = await Request.find({ assignedAgent: user.id }, '_id');
    return { request: { $in: requests.map(r => r._id) } };
  }

  return { ownerUser: user.id };
};

const buildDefaultTitle = (originalName) => {
  const title = originalName.trim();
  return title.length > 150 ? title.slice(0, 150) : title;
};

const canAccessDocument = async (document, user) => {
  if (user.role === UserRoles.ADMIN) {
    return true;
  }

  if (user.role === UserRoles.AGENT) {
    if (!document.request) return false;
    const Request = require('../requests/request.model');
    const req = await Request.findById(document.request);
    return req && req.assignedAgent?.toString() === user.id;
  }

  return document.ownerUser.toString() === user.id;
};

const buildListQuery = async (query, user) => {
  const dbQuery = {
    ...(await buildAccessQuery(user)),
  };

  if (!(user.role === UserRoles.ADMIN && query.includeDeleted === true)) {
    dbQuery.deletedAt = null;
  }

  if (query.status) {
    dbQuery.status = query.status;
  }

  if (query.documentType) {
    dbQuery.documentType = query.documentType;
  }

  if (query.requestId) {
    dbQuery.request = query.requestId;
  }

  if (user.role === UserRoles.ADMIN && query.ownerUserId) {
    dbQuery.ownerUser = query.ownerUserId;
  }

  if (user.role === UserRoles.ADMIN && query.assignedAgentId) {
    dbQuery.assignedAgent = query.assignedAgentId;
  }

  return dbQuery;
};

const uploadDocument = async ({ file, payload, user, reqId }) => {
  let storageKey;
  try {
    // 0. Enforce file limit
    if (payload.requestId) {
      const currentCount = await documentRepository.countDocuments({
        request: payload.requestId,
        deletedAt: null,
      });
      if (currentCount >= uploadConfig.maxFilesPerApplication) {
        throw new ApiError(httpStatus.CONFLICT, `Maximum allowed documents (${uploadConfig.maxFilesPerApplication}) reached for this application`);
      }
    }

    // 1. Validate magic bytes
    await fileValidation.validateFileSignature(file.path);

    // 2. Compute cryptographic hash
    const hash = await fileValidation.computeFileHash(file.path);

    // 3. Move to persistent storage
    const extension = require('path').extname(file.originalname);
    storageKey = await storageService.save(file.path, extension);

    // We update file path so if DB persistence fails we clean up the correct one
    file.storageKey = storageKey;

    const ownerUser = user.role === UserRoles.CITIZEN ? user.id : payload.ownerUserId || user.id;

    const document = await documentRepository.create({
      title: payload.title || buildDefaultTitle(file.originalname),
      documentType: payload.documentType,
      originalName: file.originalname,
      filename: storageKey,
      mimeType: file.mimetype,
      size: file.size,
      path: storageKey, // We store storageKey here
      hash,
      uploadedBy: user.id,
      ownerUser,
      request: payload.requestId,
      status: DocumentStatus.PENDING,
    });

    // Emit audit event
    const logger = require('../../config/logger');
    logger.info({ audit: true, eventType: 'DOCUMENT_UPLOADED', requestId: reqId, actorId: user.id, documentId: document.id, requestReference: payload.requestId }, 'Document uploaded successfully');

    return document;
  } catch (error) {
    if (file.storageKey) {
      await storageService.delete(file.storageKey).catch(() => {});
    } else {
      await deleteLocalFile(file.path);
    }
    throw error;
  }
};

const replaceDocument = async ({ replacedDocumentId, file, payload, user, reqId }) => {
  const oldDocument = await documentRepository.findById(replacedDocumentId);

  if (!oldDocument || oldDocument.ownerUser.toString() !== user.id) {
    await deleteLocalFile(file.path);
    throw new ApiError(httpStatus.NOT_FOUND, 'Document to replace not found');
  }

  if (oldDocument.status !== DocumentStatus.REJECTED) {
    await deleteLocalFile(file.path);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only rejected documents can be replaced');
  }

  if (oldDocument.isSuperseded) {
    await deleteLocalFile(file.path);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Document is already superseded');
  }

  // Ensure request is in correction state (DOCUMENTS_REQUIRED)
  // Actually, we trust the workflow or we check it explicitly.
  const requestService = require('../requests/request.service'); // We might need to check this, or just rely on the controller logic. Let's assume request must be DOCUMENTS_REQUIRED or DRAFT.

  // payload can carry over the requestId and documentType from the old document.
  payload.requestId = oldDocument.request;
  payload.documentType = oldDocument.documentType;

  // We reuse uploadDocument logic by calling it directly, but first we need to make sure limits don't break.
  // We supersede first? No, we supersede AFTER new upload succeeds to avoid orphan state.

  // 1. Upload new document
  const newDocument = await uploadDocument({ file, payload, user, reqId });

  // 2. Mark old document as superseded
  oldDocument.isSuperseded = true;
  oldDocument.status = DocumentStatus.SUPERSEDED;
  oldDocument.replacedBy = newDocument.id;
  oldDocument.replacedAt = new Date();
  await documentRepository.save(oldDocument);

  const logger = require('../../config/logger');
  logger.info({ audit: true, eventType: 'DOCUMENT_REPLACED', requestId: reqId, actorId: user.id, oldDocumentId: oldDocument.id, newDocumentId: newDocument.id }, 'Document replaced successfully');

  return newDocument;
};

const listDocuments = async (query, user) => {
  const page = query.page || DEFAULT_PAGE;
  const limit = query.limit || DEFAULT_LIMIT;

  const listQuery = await buildListQuery(query, user);
  return documentRepository.findPaginated({
    query: listQuery,
    page,
    limit,
  });
};

const getDocumentMetadata = async (documentId, user) => {
  const document = await documentRepository.findById(documentId, {
    includeDeleted: user.role === UserRoles.ADMIN,
  });

  if (!document || !(await canAccessDocument(document, user))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  return document;
};

const acceptDocument = async (documentId, user, reqId) => {
  const document = await documentRepository.findById(documentId);

  if (!document || !(await canAccessDocument(document, user))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  if (document.isSuperseded) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot review superseded document');
  }

  document.status = DocumentStatus.ACCEPTED; // Assuming ACCEPTED exists in DocumentStatus
  document.verifiedAt = new Date();
  document.verifiedBy = user.id;
  document.rejectedAt = undefined;
  document.rejectedBy = undefined;
  document.rejectionReason = undefined;

  document.reviewHistory.push({
    status: DocumentStatus.ACCEPTED,
    reviewer: user.id,
  });

  const saved = await documentRepository.save(document);
  const logger = require('../../config/logger');
  logger.info({ audit: true, eventType: 'DOCUMENT_ACCEPTED', requestId: reqId, actorId: user.id, documentId }, 'Document accepted');
  return saved;
};

const rejectDocument = async (documentId, rejectionReason, user, reqId) => {
  const document = await documentRepository.findById(documentId);

  if (!document || !(await canAccessDocument(document, user))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  if (document.isSuperseded) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot review superseded document');
  }

  document.status = DocumentStatus.REJECTED;
  document.rejectedAt = new Date();
  document.rejectedBy = user.id;
  document.rejectionReason = rejectionReason;
  document.verifiedAt = undefined;
  document.verifiedBy = undefined;

  document.reviewHistory.push({
    status: DocumentStatus.REJECTED,
    reviewer: user.id,
    reason: rejectionReason,
  });

  const saved = await documentRepository.save(document);
  const logger = require('../../config/logger');
  logger.info({ audit: true, eventType: 'DOCUMENT_REJECTED', requestId: reqId, actorId: user.id, documentId }, 'Document rejected');
  return saved;
};

const downloadDocument = async (documentId, user) => {
  const document = await documentRepository.findById(documentId, {
    includeDeleted: user.role === UserRoles.ADMIN,
  });

  if (!document || !(await canAccessDocument(document, user))) {
    const logger = require('../../config/logger');
    logger.warn({ audit: true, eventType: 'DOCUMENT_DOWNLOAD_DENIED', actorId: user.id, documentId }, 'Document download denied');
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  const physicalPath = storageService.getPhysicalPath(document.path);

  if (!await storageService.exists(document.path)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document file not found on disk');
  }

  return { document, physicalPath };
};

const softDeleteDocument = async (documentId, user) => {
  const document = await documentRepository.findById(documentId);

  if (!document || !(await canAccessDocument(document, user))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  document.deletedAt = new Date();
  document.deletedBy = user.id;

  return documentRepository.save(document);
};

module.exports = {
  getDocumentMetadata,
  listDocuments,
  acceptDocument,
  rejectDocument,
  downloadDocument,
  softDeleteDocument,
  uploadDocument,
  replaceDocument,
};
