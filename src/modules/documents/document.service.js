const fs = require('fs/promises');
const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const DocumentStatus = require('../../common/enums/document-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const documentRepository = require('./document.repository');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const deleteLocalFile = async (filePath) => {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => {});
};

const buildAccessQuery = (user) => {
  if (user.role === UserRoles.ADMIN) {
    return {};
  }

  if (user.role === UserRoles.AGENT) {
    return { assignedAgent: user.id };
  }

  return { ownerUser: user.id };
};

const buildDefaultTitle = (originalName) => {
  const title = originalName.trim();
  return title.length > 150 ? title.slice(0, 150) : title;
};

const canAccessDocument = (document, user) => {
  if (user.role === UserRoles.ADMIN) {
    return true;
  }

  if (user.role === UserRoles.AGENT) {
    return document.assignedAgent?.toString() === user.id;
  }

  return document.ownerUser.toString() === user.id;
};

const buildListQuery = (query, user) => {
  const dbQuery = {
    ...buildAccessQuery(user),
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

const uploadDocument = async ({ file, payload, user }) => {
  try {
    const ownerUser = user.role === UserRoles.CITIZEN ? user.id : payload.ownerUserId || user.id;
    const assignedAgent = user.role === UserRoles.AGENT ? user.id : payload.assignedAgentId;

    return await documentRepository.create({
      title: payload.title || buildDefaultTitle(file.originalname),
      documentType: payload.documentType,
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedBy: user.id,
      ownerUser,
      assignedAgent,
      request: payload.requestId,
      status: DocumentStatus.PENDING,
    });
  } catch (error) {
    await deleteLocalFile(file?.path);
    throw error;
  }
};

const listDocuments = async (query, user) => {
  const page = query.page || DEFAULT_PAGE;
  const limit = query.limit || DEFAULT_LIMIT;

  return documentRepository.findPaginated({
    query: buildListQuery(query, user),
    page,
    limit,
  });
};

const getDocumentMetadata = async (documentId, user) => {
  const document = await documentRepository.findById(documentId, {
    includeDeleted: user.role === UserRoles.ADMIN,
  });

  if (!document || !canAccessDocument(document, user)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  return document;
};

const verifyDocument = async (documentId, adminUserId) => {
  const document = await documentRepository.findById(documentId);

  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  document.status = DocumentStatus.VERIFIED;
  document.verifiedAt = new Date();
  document.verifiedBy = adminUserId;
  document.rejectedAt = undefined;
  document.rejectedBy = undefined;
  document.rejectionReason = undefined;

  return documentRepository.save(document);
};

const rejectDocument = async (documentId, rejectionReason, adminUserId) => {
  const document = await documentRepository.findById(documentId);

  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  document.status = DocumentStatus.REJECTED;
  document.rejectedAt = new Date();
  document.rejectedBy = adminUserId;
  document.rejectionReason = rejectionReason;
  document.verifiedAt = undefined;
  document.verifiedBy = undefined;

  return documentRepository.save(document);
};

const softDeleteDocument = async (documentId, user) => {
  const document = await documentRepository.findById(documentId);

  if (!document || !canAccessDocument(document, user)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  document.deletedAt = new Date();
  document.deletedBy = user.id;

  return documentRepository.save(document);
};

module.exports = {
  getDocumentMetadata,
  listDocuments,
  rejectDocument,
  softDeleteDocument,
  uploadDocument,
  verifyDocument,
};
