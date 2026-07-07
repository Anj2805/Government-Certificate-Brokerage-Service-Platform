const { check, param, query } = require('express-validator');
const validateRequest = require('../../middlewares/validate-request.middleware');

const listNotificationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('isRead')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRead must be true or false'),
];

const notificationIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid notification ID is required'),
];

module.exports = {
  listNotificationsValidation,
  notificationIdValidation,
};
