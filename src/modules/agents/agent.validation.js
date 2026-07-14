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
      RequestStatus.UNDER_REVIEW,
      RequestStatus.CORRECTION_REQUIRED,
      RequestStatus.COMPLETED,
      RequestStatus.APPROVED,
      RequestStatus.REJECTED,
    ])
    .withMessage('status must be under_review, correction_required, completed, approved, or rejected'),
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

const updateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('First name must be between 2 and 80 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Last name must be between 2 and 80 characters'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number format')
    .isLength({ max: 20 }),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
  body('city')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
  body('state')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be at most 100 characters'),
  body('postalCode')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Postal code must be at most 20 characters'),
  body('preferredLanguage')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 }),
  body('languagesSupported')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('languagesSupported must be an array'),
  body('languagesSupported.*')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 }),
];

module.exports = {
  getRequestDetails: mongoIdParam,
  listAssignedRequests,
  updateProgress,
  uploadAdditionalDocument,
  updateProfile,
};
