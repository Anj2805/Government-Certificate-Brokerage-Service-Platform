const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('../../../modules/auth/auth.routes');
const serviceRoutes = require('../../../modules/services/service.routes');
const documentRoutes = require('../../../modules/documents/document.routes');
const requestRoutes = require('../../../modules/requests/request.routes');
const agentRoutes = require('../../../modules/agents/agent.routes');
const adminRoutes = require('../../../modules/admin/admin.routes');
const userRoutes = require('../../../modules/users/user.routes');
const notificationRoutes = require('../../../modules/notifications/notification.routes');
const certificateRoutes = require('../../../modules/certificates/certificate.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/documents', documentRoutes);
router.use('/requests', requestRoutes);
router.use('/agents', agentRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/certificates', certificateRoutes);

module.exports = router;
