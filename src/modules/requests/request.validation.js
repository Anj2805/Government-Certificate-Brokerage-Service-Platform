const { body, param, query } = require('express-validator');
const RequestStatus = require('../../common/enums/request-status.enum');

const mongoIdParam = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

const paginationQuery = [
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
  query('search')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search term must be at most 100 characters'),
  query('timeFilter')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['All Time', 'Last 30 Days', 'Last 6 Months'])
    .withMessage('timeFilter must be one of: All Time, Last 30 Days, Last 6 Months'),
];

const createRequest = [
  body('serviceId').isMongoId().withMessage('serviceId must be a valid MongoDB ObjectId'),
  body('status')
    .optional()
    .isIn([RequestStatus.DRAFT, RequestStatus.SUBMITTED])
    .withMessage('status can only be draft or submitted when creating a request'),
  body('applicationData')
    .optional()
    .isObject()
    .withMessage('applicationData must be an object'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('notes must be at most 2000 characters'),
  body('documents')
    .optional()
    .isArray()
    .withMessage('documents must be an array of document IDs'),
  body('documents.*')
    .optional()
    .isMongoId()
    .withMessage('each document ID must be a valid MongoDB ObjectId'),
];

const assignAgent = [
  ...mongoIdParam,
  body('agentId').isMongoId().withMessage('agentId must be a valid MongoDB ObjectId'),
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const updateDraft = [
  ...mongoIdParam,
  body('applicationData').optional().isObject().withMessage('applicationData must be an object'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('notes must be at most 2000 characters'),
  body('documents').optional().isArray().withMessage('documents must be an array of document IDs'),
  body('documents.*').optional().isMongoId().withMessage('each document ID must be a valid MongoDB ObjectId'),
];

const withdrawRequest = [
  ...mongoIdParam,
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const requestCorrection = [
  ...mongoIdParam,
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('reason is required for correction')
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const approveRequest = [
  ...mongoIdParam,
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const rejectRequest = [
  ...mongoIdParam,
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('reason is required for rejection')
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const attachDocument = [
  ...mongoIdParam,
  body('documentId').isMongoId().withMessage('documentId must be a valid MongoDB ObjectId'),
];

module.exports = {
  assignAgent,
  withdrawRequest,
  createRequest,
  updateDraft,
  requestCorrection,
  approveRequest,
  rejectRequest,
  getRequest: mongoIdParam,
  listRequests: paginationQuery,
  submitRequest: mongoIdParam,
  attachDocument,
};
