const express = require('express');
const authenticate = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const UserRoles = require('../../common/enums/user-roles.enum');
const notificationController = require('./notification.controller');
const notificationValidation = require('./notification.validation');
const validateRequest = require('../../middlewares/validate-request.middleware');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(UserRoles.CITIZEN));

router.get(
  '/unread-count',
  notificationController.getUnreadCount,
);

router.patch(
  '/read-all',
  notificationController.markAllAsRead,
);

router.get(
  '/',
  validateRequest(notificationValidation.listNotificationsValidation),
  notificationController.listNotifications,
);

router.patch(
  '/:id/read',
  validateRequest(notificationValidation.notificationIdValidation),
  notificationController.markOneAsRead,
);

module.exports = router;
