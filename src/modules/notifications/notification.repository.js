const Notification = require('./notification.model');
const { toNotificationDTO } = require('./notification.dto');

const createNotification = async (payload) => {
  const notification = new Notification(payload);
  await notification.save();
  return notification;
};

const findPaginated = async ({ recipientId, isRead, page, limit }) => {
  const query = { recipient: recipientId };
  
  if (isRead !== undefined) {
    query.isRead = isRead;
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
  ]);

  return {
    items: notifications.map(toNotificationDTO),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const countUnread = async (recipientId) => {
  return Notification.countDocuments({
    recipient: recipientId,
    isRead: false,
  });
};

const markOneAsRead = async (notificationId, recipientId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: recipientId,
  });

  if (!notification) {
    return null;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

const markAllAsRead = async (recipientId) => {
  const result = await Notification.updateMany(
    {
      recipient: recipientId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );

  return result.modifiedCount;
};

module.exports = {
  createNotification,
  findPaginated,
  countUnread,
  markOneAsRead,
  markAllAsRead,
};
