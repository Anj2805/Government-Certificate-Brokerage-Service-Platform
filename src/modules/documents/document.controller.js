const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const documentService = require('./document.service');

const uploadDocument = asyncHandler(async (req, res) => {
  const document = await documentService.uploadDocument({
    file: req.file,
    payload: req.body,
    user: req.user,
  });

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'Document uploaded successfully',
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

const verifyDocument = asyncHandler(async (req, res) => {
  const document = await documentService.verifyDocument(req.params.id, req.user.id);

  return ApiResponse.success(res, {
    message: 'Document verified successfully',
    data: { document },
  });
});

const rejectDocument = asyncHandler(async (req, res) => {
  const document = await documentService.rejectDocument(
    req.params.id,
    req.body.rejectionReason,
    req.user.id,
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

module.exports = {
  deleteDocument,
  getDocumentMetadata,
  listDocuments,
  rejectDocument,
  uploadDocument,
  verifyDocument,
};
