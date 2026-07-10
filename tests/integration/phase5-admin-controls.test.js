const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}
const app = require('../../app');
const config = require('../../src/config');
const User = require('../../src/modules/users/user.model');
const Service = require('../../src/modules/services/service.model');
const Request = require('../../src/modules/requests/request.model');
const Notification = require('../../src/modules/notifications/notification.model');
const NotificationType = require('../../src/common/enums/notification-type.enum');

// STEP 3 - TEST DATABASE SAFETY GUARD
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Test environment must be set to NODE_ENV=test');
}

if (!config.database.uri.includes('test') && !config.database.uri.includes('_test')) {
  throw new Error('Database URI must include test marker for safety');
}

if (/prod|live|production/i.test(config.database.uri)) {
  throw new Error('Database URI looks like production, refusing to run');
}

const dbNameMatch = config.database.uri.match(/\/([^/?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : '';

if (!dbName) {
  throw new Error('Database URI must include an explicit database name');
}

if (/^(admin|local|config)$/i.test(dbName)) {
  throw new Error('Database URI must not target internal MongoDB databases');
}

test('Phase 5 - Notification System Verification', async (t) => {
  let server;
  let port;
  let API;
  
  let citizenEmail = `citizen5_${Date.now()}@example.com`;
  let adminEmail = `admin5_${Date.now()}@example.com`;
  let agentEmail = `agent5_${Date.now()}@example.com`;
  let testPassword = 'Password123';
  
  let citizenToken, citizenId, citizenAccessToken;
  let adminAccessToken;
  let agentId, agentAccessToken;
  
  let serviceId;
  let requestId;

  t.before(async () => {
    await mongoose.connect(config.database.uri);
    await Notification.deleteMany({});
    
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        API = `http://localhost:${port}/api/v1`;
        resolve();
      });
    });

    // Create Admin
    const adminRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Admin', lastName: 'User', email: adminEmail, password: testPassword, role: 'citizen' }) // register as citizen then update
    });
    const adminData = await adminRes.json();
    await User.findByIdAndUpdate(adminData.data.user._id || adminData.data.user.id, { role: 'admin', emailVerified: true });
    
    const adminLoginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword })
    });
    const adminLoginData = await adminLoginRes.json();
    adminAccessToken = adminLoginData.data.tokens.accessToken;

    // Create Agent
    const agentRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Agent', lastName: 'User', email: agentEmail, password: testPassword, role: 'agent' })
    });
    const agentData = await agentRes.json();
    agentId = agentData.data.user._id || agentData.data.user.id;
    await User.findByIdAndUpdate(agentId, { emailVerified: true, agentStatus: 'approved', isActive: true });
    
    const agentLoginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: agentEmail, password: testPassword })
    });
    const agentLoginData = await agentLoginRes.json();
    agentAccessToken = agentLoginData.data.tokens.accessToken;

    // Create Citizen
    const citizenRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Citizen', lastName: 'Test', email: citizenEmail, password: testPassword, role: 'citizen' })
    });
    const citizenData = await citizenRes.json();
    citizenId = citizenData.data.user._id || citizenData.data.user.id;
    await User.findByIdAndUpdate(citizenId, { emailVerified: true });
    
    const citizenLoginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: citizenEmail, password: testPassword })
    });
    const citizenLoginData = await citizenLoginRes.json();
    citizenAccessToken = citizenLoginData.data.tokens.accessToken;

    // Create Service
    const serviceRes = await fetch(`${API}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAccessToken}` },
      body: JSON.stringify({
        name: `Test Service ${Date.now()}`,
        category: 'certificate',
        requiredDocuments: ['identity_proof'],
        estimatedProcessingDays: 5,
        serviceCharge: 100,
        isActive: true
      })
    });
    const serviceData = await serviceRes.json();
    serviceId = serviceData.data.service._id;
  });

  t.after(async () => {
    await mongoose.disconnect();
    server.close();
  });

  await t.test('Creating request creates REQUEST_SUBMITTED notification', async () => {
    const res = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` },
      body: JSON.stringify({
        serviceId,
        status: 'draft',
        notes: 'Test request'
      })
    });
    
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    requestId = data.data.request._id;
    
    const subRes = await fetch(`${API}/requests/${requestId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` }
    });
    assert.strictEqual(subRes.status, 200);
    
    const notifCount = await Notification.countDocuments({ request: requestId, type: NotificationType.REQUEST_SUBMITTED });
    assert.strictEqual(notifCount, 1);
  });

  await t.test('Unread count endpoint returns 1', async () => {
    const res = await fetch(`${API}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.unreadCount, 1);
  });

  await t.test('Admin assigning agent creates AGENT_ASSIGNED notification', async () => {
    const res = await fetch(`${API}/requests/admin/${requestId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAccessToken}` },
      body: JSON.stringify({ agentId })
    });
    
    assert.strictEqual(res.status, 200);
    const notifCount = await Notification.countDocuments({ request: requestId, type: NotificationType.AGENT_ASSIGNED });
    assert.strictEqual(notifCount, 1);
  });

  await t.test('Agent updating progress creates REQUEST_IN_PROGRESS notification', async () => {
    const res = await fetch(`${API}/requests/agent/${requestId}/start-processing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentAccessToken}` }
    });
    
    assert.strictEqual(res.status, 200);
    const notifCount = await Notification.countDocuments({ request: requestId, type: NotificationType.REQUEST_IN_PROGRESS });
    assert.strictEqual(notifCount, 1);
  });

  await t.test('List notifications returns all notifications for citizen', async () => {
    const res = await fetch(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.notifications.length, 3);
  });

  await t.test('Mark one as read', async () => {
    const listRes = await fetch(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    const listData = await listRes.json();
    const notifId = listData.data.notifications[0].id;
    
    const readRes = await fetch(`${API}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    assert.strictEqual(readRes.status, 200);
    
    const countRes = await fetch(`${API}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    const countData = await countRes.json();
    assert.strictEqual(countData.data.unreadCount, 2);
  });

  await t.test('Mark all as read', async () => {
    const readAllRes = await fetch(`${API}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    assert.strictEqual(readAllRes.status, 200);
    
    const countRes = await fetch(`${API}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    const countData = await countRes.json();
    assert.strictEqual(countData.data.unreadCount, 0);
  });
  await t.test('Idempotency: Concurrency test with 10 simultaneous attempts', async () => {
    const notificationService = require('../../src/modules/notifications/notification.service');
    const promises = [];
    const eventId = new mongoose.Types.ObjectId().toString();
    const reqId = new mongoose.Types.ObjectId().toString();
    for (let i = 0; i < 10; i++) {
      promises.push(notificationService.createRequestNotification({
        recipientId: citizenId,
        requestId: reqId,
        type: NotificationType.REQUEST_COMPLETED,
        eventId
      }));
    }
    
    await Promise.all(promises);
    
    const count = await Notification.countDocuments({ deduplicationKey: `${reqId}:${NotificationType.REQUEST_COMPLETED}:${eventId}` });
    assert.strictEqual(count, 1);
    
    // Distinct event creates a new one
    await notificationService.createRequestNotification({
      recipientId: citizenId,
      requestId: reqId,
      type: NotificationType.REQUEST_COMPLETED,
      eventId: new mongoose.Types.ObjectId().toString()
    });
    const totalCount = await Notification.countDocuments({ request: reqId, type: NotificationType.REQUEST_COMPLETED });
    assert.strictEqual(totalCount, 2);
  });

  await t.test('Agent blocked from all four notification APIs', async () => {
    let res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${agentAccessToken}` } });
    assert.strictEqual(res.status, 403);
    res = await fetch(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${agentAccessToken}` } });
    assert.strictEqual(res.status, 403);
    res = await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${agentAccessToken}` } });
    assert.strictEqual(res.status, 403);
    res = await fetch(`${API}/notifications/dummy_id/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${agentAccessToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await t.test('Admin blocked from all four notification APIs', async () => {
    let res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${adminAccessToken}` } });
    assert.strictEqual(res.status, 403);
    res = await fetch(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${adminAccessToken}` } });
    assert.strictEqual(res.status, 403);
    res = await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminAccessToken}` } });
    assert.strictEqual(res.status, 403);
    res = await fetch(`${API}/notifications/dummy_id/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminAccessToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await t.test('Unauthenticated users blocked from all four notification APIs', async () => {
    let res = await fetch(`${API}/notifications`);
    assert.strictEqual(res.status, 401);
    res = await fetch(`${API}/notifications/unread-count`);
    assert.strictEqual(res.status, 401);
    res = await fetch(`${API}/notifications/read-all`, { method: 'PATCH' });
    assert.strictEqual(res.status, 401);
    res = await fetch(`${API}/notifications/dummy_id/read`, { method: 'PATCH' });
    assert.strictEqual(res.status, 401);
  });

  await t.test('Remaining Transitions: documents_required, rejected', async () => {
    // Transition to documents_required
    let res = await fetch(`${API}/requests/agent/${requestId}/request-correction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentAccessToken}` },
      body: JSON.stringify({ reason: 'need ID' })
    });
    assert.strictEqual(res.status, 200);
    let count = await Notification.countDocuments({ request: requestId, type: NotificationType.DOCUMENTS_REQUIRED });
    assert.strictEqual(count, 1);

    // Transition back to in_progress (simulate upload)
    await fetch(`${API}/requests/${requestId}/resubmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` }
    });

    // Transition to rejected via Agent (Admin doesn't reject directly anymore)
    res = await fetch(`${API}/requests/agent/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentAccessToken}` },
      body: JSON.stringify({ reason: 'invalid' })
    });
    assert.strictEqual(res.status, 200);
    count = await Notification.countDocuments({ request: requestId, type: NotificationType.REQUEST_REJECTED });
    assert.strictEqual(count, 1);
  });

  await t.test('Failure injection tests for all transitions', async () => {
    const notificationRepository = require('../../src/modules/notifications/notification.repository');
    const originalCreate = notificationRepository.createNotification;
    notificationRepository.createNotification = async () => {
      throw new Error('Injected failure');
    };
    
    // Create new request
    let res = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` },
      body: JSON.stringify({ serviceId, status: 'draft', notes: 'Test injection' })
    });
    let data = await res.json();
    let newReqId = data.data.request._id;

    // 1. Submit
    res = await fetch(`${API}/requests/${newReqId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` }
    });
    assert.strictEqual(res.status, 200);

    // 2. Cancellation
    res = await fetch(`${API}/requests/${newReqId}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` }
    });
    assert.strictEqual(res.status, 200);
    
    // Check it created no notifications
    let count = await Notification.countDocuments({ request: newReqId });
    assert.strictEqual(count, 0);

    // 3. Admin Assignment
    res = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizenAccessToken}` },
      body: JSON.stringify({ serviceId, status: 'draft' })
    });
    newReqId = (await res.json()).data.request._id;
    await fetch(`${API}/requests/${newReqId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${citizenAccessToken}` } });
    
    res = await fetch(`${API}/requests/admin/${newReqId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAccessToken}` },
      body: JSON.stringify({ agentId })
    });
    assert.strictEqual(res.status, 200);

    // 4. Status Transition
    res = await fetch(`${API}/requests/agent/${newReqId}/start-processing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentAccessToken}` }
    });
    assert.strictEqual(res.status, 200);

    // Check again
    count = await Notification.countDocuments({ request: newReqId });
    assert.strictEqual(count, 0);

    // Restore
    notificationRepository.createNotification = originalCreate;
  });
});
