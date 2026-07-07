const { body, param, query } = require('express-validator');
const RequestStatus = require('../../common/enums/request-status.enum');

const mongoIdParam = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

const listAssignedRequests = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be an integer between 1 and 100'),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(Object.values(RequestStatus))
    .withMessage('status must be a valid request status'),
  query('serviceId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('serviceId must be a valid MongoDB ObjectId'),
];

const updateProgress = [
  ...mongoIdParam,
  body('status')
    .isIn([
      RequestStatus.IN_PROGRESS,
      RequestStatus.DOCUMENTS_REQUIRED,
      RequestStatus.COMPLETED,
    ])
    .withMessage('status must be in_progress, documents_required, or completed'),
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const uploadAdditionalDocument = [
  ...mongoIdParam,
  body('title')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('title must be between 2 and 150 characters'),
  body('documentType')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('documentType must be between 2 and 80 characters')
    .toLowerCase(),
];

module.exports = {
  getRequestDetails: mongoIdParam,
  listAssignedRequests,
  updateProgress,
  uploadAdditionalDocument,
};
