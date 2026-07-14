const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const documentService = require('./document.service');

const uploadDocument = asyncHandler(async (req, res) => {
  const document = await documentService.uploadDocument({
    file: req.file,
    payload: req.body,
    user: req.user,
    reqId: req.id,
  });

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'Document uploaded successfully',
    data: { document },
  });
});

const replaceDocument = asyncHandler(async (req, res) => {
  const document = await documentService.replaceDocument({
    replacedDocumentId: req.params.id,
    file: req.file,
    payload: req.body,
    user: req.user,
    reqId: req.id,
  });

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'Document replaced successfully',
    data: { document },
  });
});

const listDocuments = asyncHandler(async (req, res) => {
  const result = await documentService.listDocuments(req.query, req.user);

  return ApiResponse.success(res, {
    message: 'Documents fetched successfully',
    data: { documents: result.items },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const getDocumentMetadata = asyncHandler(async (req, res) => {
  const document = await documentService.getDocumentMetadata(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Document metadata fetched successfully',
    data: { document },
  });
});

const acceptDocument = asyncHandler(async (req, res) => {
  const document = await documentService.acceptDocument(req.params.id, req.user, req.id);

  return ApiResponse.success(res, {
    message: 'Document accepted successfully',
    data: { document },
  });
});

const rejectDocument = asyncHandler(async (req, res) => {
  const document = await documentService.rejectDocument(
    req.params.id,
    req.body.rejectionReason,
    req.user,
    req.id
  );

  return ApiResponse.success(res, {
    message: 'Document rejected successfully',
    data: { document },
  });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await documentService.softDeleteDocument(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Document deleted successfully',
    data: { document },
  });
});

const downloadDocument = asyncHandler(async (req, res) => {
  const { document, strategy } = await documentService.downloadDocument(req.params.id, req.user);

  if (req.query.json === 'true') {
    return ApiResponse.success(res, {
      message: 'Download strategy fetched',
      data: {
        url: strategy.url || strategy.physicalPath,
        type: strategy.type,
      }
    });
  }

  if (strategy.type === 'redirect') {
    return res.redirect(strategy.url);
  } else if (strategy.type === 'local') {
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(strategy.physicalPath);
  } else {
    throw new Error('Unsupported download strategy');
  }
});

module.exports = {
  deleteDocument,
  getDocumentMetadata,
  listDocuments,
  rejectDocument,
  uploadDocument,
  acceptDocument,
  downloadDocument,
  replaceDocument,
};
