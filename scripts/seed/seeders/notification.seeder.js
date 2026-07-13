const Notification = require('../../../src/modules/notifications/notification.model');
const NotificationType = require('../../../src/common/enums/notification-type.enum');
const crypto = require('crypto');

async function seedNotifications(requests, admin) {
  console.log('Seeding Notifications...');
  const notifDocs = [];

  for (const req of requests) {
    if (req.status === 'draft') continue;

    // To Citizen
    const citizenNotifs = [
      {
        recipient: req.citizen,
        title: 'Application Submitted',
        message: `Your application ${req.requestNumber} for ${req.serviceSnapshot.serviceName} has been submitted successfully.`,
        type: NotificationType.REQUEST_SUBMITTED,
        request: req._id,
        isRead: true,
        createdAt: req.submittedAt
      }
    ];

    if (req.status === 'assigned' || req.status === 'under_review' || req.status === 'approved' || req.status === 'completed') {
      citizenNotifs.push({
        recipient: req.citizen,
        title: 'Agent Assigned',
        message: `An agent has been assigned to your application ${req.requestNumber}.`,
        type: NotificationType.AGENT_ASSIGNED,
        request: req._id,
        isRead: true,
        createdAt: req.assignedAt
      });
    }

    if (req.status === 'approved' || req.status === 'completed') {
      citizenNotifs.push({
        recipient: req.citizen,
        title: 'Application Approved',
        message: `Your application ${req.requestNumber} has been approved.`,
        type: NotificationType.REQUEST_COMPLETED,
        request: req._id,
        isRead: Math.random() > 0.5,
        createdAt: new Date(req.assignedAt.getTime() + 86400000)
      });
    }

    if (req.status === 'correction_required') {
      citizenNotifs.push({
        recipient: req.citizen,
        title: 'Correction Required',
        message: `Your application ${req.requestNumber} requires corrections: Address proof is blurry.`,
        type: NotificationType.DOCUMENTS_REQUIRED,
        request: req._id,
        isRead: false,
        createdAt: req.assignedAt // approximating
      });
    }

    if (req.deliveryStatus && req.deliveryStatus !== 'NOT_REQUIRED') {
      citizenNotifs.push({
        recipient: req.citizen,
        title: 'Delivery Update',
        message: `Delivery status for ${req.requestNumber} is now ${req.deliveryStatus}.`,
        type: NotificationType.INFO,
        request: req._id,
        isRead: false,
        createdAt: req.completedAt || new Date()
      });
    }

    // To Agent
    if (req.assignedAgent) {
      const dedupKeyAgent = crypto.createHash('sha256').update(`ASSIGN-${req._id}-${req.assignedAgent}`).digest('hex');
      notifDocs.push(
        await Notification.findOneAndUpdate(
          { deduplicationKey: dedupKeyAgent },
          {
            recipient: req.assignedAgent,
            title: 'New Assignment',
            message: `You have been assigned to review request ${req.requestNumber}.`,
            type: NotificationType.AGENT_ASSIGNED,
            request: req._id,
            isRead: Math.random() > 0.2,
            deduplicationKey: dedupKeyAgent,
            createdAt: req.assignedAt
          },
          { upsert: true, new: true }
        )
      );
    }

    // Save Citizen Notifs
    for (const n of citizenNotifs) {
      const dedupKeyCitizen = crypto.createHash('sha256').update(`${n.type}-${req._id}-${n.recipient}-${n.title}`).digest('hex');
      notifDocs.push(
        await Notification.findOneAndUpdate(
          { deduplicationKey: dedupKeyCitizen },
          { ...n, deduplicationKey: dedupKeyCitizen },
          { upsert: true, new: true }
        )
      );
    }
  }

  console.log(`Seeded ${notifDocs.length} Notifications.`);
  return notifDocs;
}

module.exports = { seedNotifications };
