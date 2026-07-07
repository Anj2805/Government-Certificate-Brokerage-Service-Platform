const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const ApiError = require('../../common/errors/api-error');
const notificationService = require('./notification.service');
const { toNotificationDTO } = require('./notification.dto');

const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications({
      recipientId: req.user.id,
      query: req.query,
    });

    return ApiResponse.success(res, {
      message: 'Notifications fetched successfully',
      data: {
        notifications: result.items,
      },
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);

    return ApiResponse.success(res, {
      message: 'Unread count fetched successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const markOneAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markOneAsRead(req.params.id, req.user.id);

    if (!notification) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }

    return ApiResponse.success(res, {
      message: 'Notification marked as read',
      data: {
        notification: toNotificationDTO(notification),
      }
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);

    return ApiResponse.success(res, {
      message: 'All notifications marked as read',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
};
