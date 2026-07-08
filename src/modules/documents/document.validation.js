const { body, param, query } = require('express-validator');
const DocumentStatus = require('../../common/enums/document-status.enum');

const mongoIdParam = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

const uploadDocument = [
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
  body('requestId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('requestId must be a valid MongoDB ObjectId'),
  body('ownerUserId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('ownerUserId must be a valid MongoDB ObjectId'),
  body('assignedAgentId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('assignedAgentId must be a valid MongoDB ObjectId'),
];

const listDocuments = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be an integer between 1 and 100'),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(Object.values(DocumentStatus))
    .withMessage('status must be pending, accepted, rejected, or superseded'),
  query('documentType')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('documentType must be between 2 and 80 characters')
    .toLowerCase(),
  query('requestId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('requestId must be a valid MongoDB ObjectId'),
  query('ownerUserId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('ownerUserId must be a valid MongoDB ObjectId'),
  query('assignedAgentId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('assignedAgentId must be a valid MongoDB ObjectId'),
  query('includeDeleted')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('includeDeleted must be a boolean'),
];

const getDocument = mongoIdParam;
const deleteDocument = mongoIdParam;
const acceptDocument = mongoIdParam;

const rejectDocument = [
  ...mongoIdParam,
  body('rejectionReason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('rejectionReason must be between 5 and 500 characters'),
];

module.exports = {
  deleteDocument,
  getDocument,
  listDocuments,
  rejectDocument,
  uploadDocument,
  acceptDocument,
};
