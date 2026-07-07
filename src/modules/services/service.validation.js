const { body, param, query } = require('express-validator');

const mongoIdParam = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

const servicePayload = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('name must be between 2 and 150 characters'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('description must be at most 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('category must be between 2 and 80 characters')
    .toLowerCase(),
  body('requiredDocuments')
    .isArray({ min: 1 })
    .withMessage('requiredDocuments must contain at least one document'),
  body('requiredDocuments.*')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('each required document must be between 2 and 120 characters'),
  body('estimatedProcessingDays')
    .if(body('estimatedTime').not().exists())
    .isInt({ min: 1 })
    .toInt()
    .withMessage('estimatedProcessingDays is required and must be a positive integer'),
  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('estimatedTime must be a positive integer'),
  body('serviceCharge')
    .isFloat({ min: 0 })
    .toFloat()
    .withMessage('serviceCharge must be zero or greater'),
  body('isActive')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('isActive must be a boolean'),
];

const updatePayload = [
  ...mongoIdParam,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('name must be between 2 and 150 characters'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('description must be at most 2000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('category must be between 2 and 80 characters')
    .toLowerCase(),
  body('requiredDocuments')
    .optional()
    .isArray({ min: 1 })
    .withMessage('requiredDocuments must contain at least one document'),
  body('requiredDocuments.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('each required document must be between 2 and 120 characters'),
  body('estimatedProcessingDays')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('estimatedProcessingDays must be a positive integer'),
  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('estimatedTime must be a positive integer'),
  body('serviceCharge')
    .optional()
    .isFloat({ min: 0 })
    .toFloat()
    .withMessage('serviceCharge must be zero or greater'),
  body('isActive')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('isActive must be a boolean'),
];

const listServices = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be an integer between 1 and 100'),
  query('search')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('search must be between 2 and 150 characters'),
  query('category')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('category must be between 2 and 80 characters')
    .toLowerCase(),
  query('includeInactive')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('includeInactive must be a boolean'),
  query('includeDeleted')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('includeDeleted must be a boolean'),
];

const getService = mongoIdParam;
const deleteService = mongoIdParam;

const setActiveStatus = [
  ...mongoIdParam,
  body('isActive').isBoolean().toBoolean().withMessage('isActive must be a boolean'),
];

module.exports = {
  createService: servicePayload,
  deleteService,
  getService,
  listServices,
  setActiveStatus,
  updateService: updatePayload,
};
