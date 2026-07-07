const toNotificationDTO = (notification) => {
  return {
    id: notification._id || notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    requestId: notification.request,
    isRead: notification.isRead,
    readAt: notification.readAt,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

module.exports = {
  toNotificationDTO,
};
