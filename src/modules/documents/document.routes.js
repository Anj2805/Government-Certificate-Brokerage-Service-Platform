const { Router } = require('express');
const Permissions = require('../../common/enums/permissions.enum');
const authenticate = require('../../middlewares/auth.middleware');
const { authorizePermission } = require('../../middlewares/role.middleware');
const { uploadSingleDocument } = require('../../middlewares/upload.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const documentController = require('./document.controller');
const documentValidation = require('./document.validation');

const router = Router();

router.post(
  '/',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_UPLOAD),
  uploadSingleDocument('document'),
  validateRequest(documentValidation.uploadDocument),
  documentController.uploadDocument,
);

router.post(
  '/:id/replace',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_UPLOAD),
  uploadSingleDocument('document'),
  validateRequest(documentValidation.getDocument),
  documentController.replaceDocument,
);

router.get(
  '/',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_VIEW),
  validateRequest(documentValidation.listDocuments),
  documentController.listDocuments,
);

router.get(
  '/:id',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_VIEW),
  validateRequest(documentValidation.getDocument),
  documentController.getDocumentMetadata,
);

router.patch(
  '/:id/accept',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_VERIFY),
  validateRequest(documentValidation.acceptDocument), // We will update validation next
  documentController.acceptDocument,
);

router.patch(
  '/:id/reject',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_VERIFY),
  validateRequest(documentValidation.rejectDocument),
  documentController.rejectDocument,
);

router.delete(
  '/:id',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_VIEW), // Only Citizen uses this, policy is enforced in service
  validateRequest(documentValidation.deleteDocument),
  documentController.deleteDocument,
);

router.get(
  '/:id/download',
  authenticate,
  authorizePermission(Permissions.DOCUMENT_VIEW),
  validateRequest(documentValidation.getDocument),
  documentController.downloadDocument,
);

module.exports = router;
