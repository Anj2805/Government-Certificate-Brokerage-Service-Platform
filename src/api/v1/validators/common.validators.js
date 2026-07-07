const { param, query } = require('express-validator');

const mongoIdParam = (fieldName = 'id') => [
  param(fieldName).isMongoId().withMessage(`${fieldName} must be a valid MongoDB ObjectId`),
];

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be an integer between 1 and 100'),
];

module.exports = {
  mongoIdParam,
  paginationQuery,
};
