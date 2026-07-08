const NotificationType = require('../../common/enums/notification-type.enum');
const notificationRepository = require('./notification.repository');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const buildNotificationContent = (type) => {
  switch (type) {
    case NotificationType.REQUEST_SUBMITTED:
      return {
        title: 'Request Submitted',
        message: 'Your service request has been submitted successfully.',
      };
    case NotificationType.AGENT_ASSIGNED:
      return {
        title: 'Agent Assigned',
        message: 'An agent has been assigned to your service request.',
      };
    case NotificationType.REQUEST_IN_PROGRESS:
      return {
        title: 'Request In Progress',
        message: 'Work has started on your service request.',
      };
    case NotificationType.DOCUMENTS_REQUIRED:
      return {
        title: 'Additional Documents Required',
        message: 'Additional documents are required to continue processing your service request.',
      };
    case NotificationType.REQUEST_COMPLETED:
      return {
        title: 'Request Completed',
        message: 'Your service request has been completed.',
      };
    case NotificationType.REQUEST_REJECTED:
      return {
        title: 'Request Rejected',
        message: 'Your service request has been rejected.',
      };
    case NotificationType.REQUEST_CANCELLED:
      return {
        title: 'Request Cancelled',
        message: 'Your service request has been cancelled.',
      };
    default:
      return {
        title: 'Update on Your Request',
        message: 'There is a new update on your service request.',
      };
  }
};

const createRequestNotification = async ({ recipientId, requestId, type, eventId, metadata = {} }) => {
  try {
    const { title, message } = buildNotificationContent(type);
    
    // Identity must distinguish repeated legitimate events: requestId + type + eventId
    const deduplicationKey = `${requestId}:${type}:${eventId}`;

    await notificationRepository.createNotification({
      recipient: recipientId,
      type,
      title,
      message,
      request: requestId,
      metadata,
      deduplicationKey,
    });
    // Additionally, queue an external delivery outbox event if the user has external notifications enabled (implicit for this phase).
    const jobService = require('../jobs/job.service');
    const User = require('../users/user.model');
    const recipient = await User.findById(recipientId).select('+email');

    if (recipient && recipient.email) {
      await jobService.enqueueOutboxEvent({
        eventType: type,
        aggregateType: 'Request',
        aggregateId: requestId,
        idempotencyKey: `EXTERNAL_NOTIFICATION:${requestId}:${type}:${eventId}`,
        payload: {
          recipientId,
          requestId,
          type,
          title,
          message,
        },
        jobsToCreate: [
          {
            channel: 'EMAIL',
            jobType: 'APPLICATION_NOTIFICATION',
            recipientReference: recipient.email,
            payload: {
              title,
              message,
              type,
            },
          }
        ]
      });
    }

  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error: race condition or repeated creation for same eventId.
      // This is expected and safe, treat as idempotent success.
      return;
    }
    // Failures log safely without blowing up request workflow
    const logData = { error: error.message, recipientId, requestId, type, deduplicationKey: `${requestId}:${type}:${eventId}` };
    console.error('Failed to create notification', logData);
  }
};

const listNotifications = async ({ recipientId, query }) => {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  let limit = Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT);
  limit = Math.min(limit, MAX_LIMIT);

  let isRead = undefined;
  if (query.isRead === 'true') isRead = true;
  else if (query.isRead === 'false') isRead = false;

  return notificationRepository.findPaginated({
    recipientId,
    isRead,
    page,
    limit,
  });
};

const getUnreadCount = async (recipientId) => {
  const count = await notificationRepository.countUnread(recipientId);
  return { unreadCount: count };
};

const markOneAsRead = async (notificationId, recipientId) => {
  const notification = await notificationRepository.markOneAsRead(notificationId, recipientId);
  return notification;
};

const markAllAsRead = async (recipientId) => {
  const updatedCount = await notificationRepository.markAllAsRead(recipientId);
  return { updatedCount };
};

module.exports = {
  createRequestNotification,
  listNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
};
