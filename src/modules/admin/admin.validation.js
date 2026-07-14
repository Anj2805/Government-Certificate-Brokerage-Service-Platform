const { body, param, query } = require('express-validator');
const AgentStatus = require('../../common/enums/agent-status.enum');
const RequestStatus = require('../../common/enums/request-status.enum');

const mongoIdParam = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

const listAgents = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be an integer between 1 and 100'),
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(Object.values(AgentStatus))
    .withMessage('status must be pending, approved, rejected, or suspended'),
  query('search')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('search must be between 2 and 100 characters'),
];

const listRequests = [
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

const rejectAgent = [
  ...mongoIdParam,
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('reason must be between 5 and 500 characters'),
];

const suspendAgent = [
  ...mongoIdParam,
  body('reason')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('reason must be at most 500 characters'),
];

const updateAgentBackground = [
  ...mongoIdParam,
  body('background')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('background must be at most 1000 characters'),
];

const updateAgentDepartment = [
  ...mongoIdParam,
  body('department')
    .notEmpty()
    .withMessage('department is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('department must be at most 100 characters'),
];

module.exports = {
  approveAgent: mongoIdParam,
  getRequestDetails: mongoIdParam,
  listAgents,
  listRequests,
  rejectAgent,
  suspendAgent,
  updateAgentBackground,
  updateAgentDepartment,
};
