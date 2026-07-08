const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const jwtUtil = require('./src/modules/auth/jwt.util');

const API = 'http://localhost:5008/api/v1';

let serverProcess;
let db;

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

test('Phase 7 - Workflow and Security Verification', async (t) => {
  t.before(async () => {
    // Connect DB directly to seed/verify
    await mongoose.connect(process.env.MONGODB_URI);
    db = mongoose.connection;
    await db.collection('users').deleteMany({});
    await db.collection('services').deleteMany({});
    await db.collection('requests').deleteMany({});

    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: 5008, NODE_ENV: 'test', REQUEST_BODY_LIMIT: '10kb' },
      stdio: 'ignore'
    });

    for (let i = 0; i < 20; i++) {
      try {
        await fetch(`${API.replace('/api/v1', '')}/`);
        break;
      } catch (err) {
        await sleep(500);
      }
    }
  });

  t.after(async () => {
    if (serverProcess) serverProcess.kill();
    await mongoose.disconnect();
  });

  let citizen1Token, citizen2Token, agentToken, adminToken;
  let citizen1Id, citizen2Id, agentId, adminId;
  let serviceId;
  let draftRequestId;

  await t.test('Seed Users and Service', async () => {
    const citizen1Raw = await db.collection('users').insertOne({
      firstName: 'C', lastName: '1', email: 'c1@ex.com', password: 'hash', role: 'citizen', isActive: true, emailVerified: true
    });
    citizen1Id = citizen1Raw.insertedId.toString();
    citizen1Token = jwtUtil.signAccessToken({ id: citizen1Id, role: 'citizen' });

    const citizen2Raw = await db.collection('users').insertOne({
      firstName: 'C', lastName: '2', email: 'c2@ex.com', password: 'hash', role: 'citizen', isActive: true, emailVerified: true
    });
    citizen2Id = citizen2Raw.insertedId.toString();
    citizen2Token = jwtUtil.signAccessToken({ id: citizen2Id, role: 'citizen' });

    // Agent 1
    const agentRaw = await db.collection('users').insertOne({
      firstName: 'Agent', lastName: 'A', email: 'agent@ex.com', password: 'hash', role: 'agent', isActive: true, agentStatus: 'approved'
    });
    agentId = agentRaw.insertedId.toString();
    agentToken = jwtUtil.signAccessToken({ id: agentId, role: 'agent' });

    // Agent 2 (for isolation testing)
    const agent2Raw = await db.collection('users').insertOne({
      firstName: 'Agent', lastName: 'B', email: 'agent2@ex.com', password: 'hash', role: 'agent', isActive: true, agentStatus: 'approved'
    });
    const agent2Id = agent2Raw.insertedId.toString();
    // Setting as global for isolation test
    global.agent2Token = jwtUtil.signAccessToken({ id: agent2Id, role: 'agent' });

    // Admin
    const adminRaw = await db.collection('users').insertOne({
      firstName: 'Admin', lastName: 'A', email: 'admin@ex.com', password: 'hash', role: 'admin', isActive: true
    });
    adminId = adminRaw.insertedId.toString();
    adminToken = jwtUtil.signAccessToken({ id: adminId, role: 'admin' });

    // Service
    const serviceRaw = await db.collection('services').insertOne({
      name: 'Test Service', category: 'General', estimatedProcessingDays: 5, serviceCharge: 100, isActive: true
    });
    serviceId = serviceRaw.insertedId.toString();
  });

  await t.test('Authentication Token Handling (Phase 6)', async () => {
    const r1 = await fetch(`${API}/requests/my`, { headers: {} });
    assert.strictEqual(r1.status, 401);
    
    const r2 = await fetch(`${API}/requests/my`, { headers: { Authorization: 'Bearer malformed' } });
    assert.strictEqual(r2.status, 401);

    const expiredToken = jwtUtil.signAccessToken({ id: citizen1Id, role: 'citizen' });
    // In order to make it expired quickly without depending on config, wait... I will just mock it manually
    const jwt = require('jsonwebtoken');
    const expiredTokenReal = jwt.sign({ sub: citizen1Id, role: 'citizen' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '-1s', issuer: 'SevaSetu API' });
    const r3 = await fetch(`${API}/requests/my`, { headers: { Authorization: `Bearer ${expiredTokenReal}` } });
    assert.strictEqual(r3.status, 401);
  });

  await t.test('MongoDB Injection Defense (Phase 6)', async () => {
    const res = await fetch(`${API}/requests/my?status[$ne]=draft`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    assert.strictEqual(res.status, 400); // Validation fails because status is an object or invalid
  });

  await t.test('Mass Assignment Defense (Phase 6 & 7)', async () => {
    // Attempt to inject status and assignedAgent during draft creation
    const res = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` },
      body: JSON.stringify({ serviceId, status: 'completed', assignedAgent: agentId, citizen: citizen2Id })
    });
    assert.strictEqual(res.status, 400); // validation rejects it
  });

  await t.test('Draft Creation & Update (Phase 7)', async () => {
    const res = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` },
      body: JSON.stringify({ serviceId, applicationData: { foo: 'bar' } })
    });
    
    if (res.status !== 201) {
      console.log(await res.text());
    }

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    draftRequestId = data.data.request._id;
    assert.strictEqual(data.data.request.status, 'draft');

    // Update draft
    const upd = await fetch(`${API}/requests/${draftRequestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` },
      body: JSON.stringify({ applicationData: { foo: 'baz' } })
    });
    assert.strictEqual(upd.status, 200);
  });

  await t.test('IDOR/BOLA Protection (Phase 6 & 7)', async () => {
    // Citizen 2 tries to read Citizen 1's draft
    const res = await fetch(`${API}/requests/${draftRequestId}`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    assert.strictEqual(res.status, 404);

    // Citizen 2 tries to submit Citizen 1's draft
    const sub = await fetch(`${API}/requests/${draftRequestId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen2Token}` }
    });
    assert.strictEqual(sub.status, 404);
  });

  await t.test('Application Submit Workflow', async () => {
    const res = await fetch(`${API}/requests/${draftRequestId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.request.status, 'submitted');
    assert.ok(data.data.request.requestNumber);
  });

  await t.test('Admin Assignment & RBAC', async () => {
    // Citizen tries to assign
    const fail = await fetch(`${API}/requests/admin/${draftRequestId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` },
      body: JSON.stringify({ agentId })
    });
    assert.strictEqual(fail.status, 403);

    // Admin assigns
    const res = await fetch(`${API}/requests/admin/${draftRequestId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ agentId })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.request.status, 'assigned');
    assert.strictEqual(data.data.request.assignedAgent, agentId);
  });

  await t.test('Agent Processing & Correction Workflow', async () => {
    // Agent 2 attempts to process Agent 1's assigned request (Agent Isolation)
    let failRes = await fetch(`${API}/requests/agent/${draftRequestId}/start-processing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${global.agent2Token}` }
    });
    assert.strictEqual(failRes.status, 404); // Should be 404 because ensureRequestAccess hides it

    // Agent starts processing
    let res = await fetch(`${API}/requests/agent/${draftRequestId}/start-processing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentToken}` }
    });
    assert.strictEqual(res.status, 200);
    let data = await res.json();
    assert.strictEqual(data.data.request.status, 'in_progress');

    // Agent requests correction
    res = await fetch(`${API}/requests/agent/${draftRequestId}/request-correction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentToken}` },
      body: JSON.stringify({ reason: 'Need better proof' })
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.data.request.status, 'documents_required');

    // Citizen resubmits
    res = await fetch(`${API}/requests/${draftRequestId}/resubmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` }
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.data.request.status, 'in_progress');
  });

  await t.test('Agent Approve & Concurrency', async () => {
    // Test Concurrency Control: simulate concurrent approve/reject race condition
    const [res1, res2] = await Promise.all([
      fetch(`${API}/requests/agent/${draftRequestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentToken}` }
      }),
      fetch(`${API}/requests/agent/${draftRequestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentToken}` },
        body: JSON.stringify({ reason: 'testing conflict' })
      })
    ]);
    
    const statuses = [res1.status, res2.status];
    assert.ok(statuses.includes(200));
    assert.ok(statuses.includes(409) || statuses.includes(400)); // 409 for conflict, or 400 if state already terminal

    // Fetch fresh to verify it's terminal
    const verifyReq = await fetch(`${API}/requests/${draftRequestId}`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    const verifyData = await verifyReq.json();
    if (!verifyData.data || !verifyData.data.request) {
      console.log('verifyData:', verifyData);
    }
    assert.ok(verifyData.data.request.status === 'completed' || verifyData.data.request.status === 'rejected');

    // Terminal state mutation blocked
    const termRes = await fetch(`${API}/requests/admin/${draftRequestId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ agentId })
    });
    assert.strictEqual(termRes.status, 400);

    // Verify Immutable History and Application Number
    const dbDoc = await db.collection('requests').findOne({ _id: new mongoose.Types.ObjectId(draftRequestId) });
    assert.ok(dbDoc.requestNumber, 'requestNumber should be present');
    assert.ok(Array.isArray(dbDoc.statusHistory), 'statusHistory should be an array');
    
    // Draft -> Submit -> Assign -> In_Progress -> Docs_Required -> In_Progress -> Completed/Rejected
    // Let's count them:
    // 1: created (draft)
    // 2: submitRequest -> 'submitted'
    // 3: assignAgent -> 'assigned'
    // 4: startProcessing -> 'in_progress'
    // 5: requestCorrection -> 'documents_required'
    // 6: resubmitRequest -> 'in_progress'
    // 7: approveRequest or rejectRequest -> 'completed' or 'rejected'
    // reassignAgent (from before terminal) wasn't called on this doc.
    assert.strictEqual(dbDoc.statusHistory.length, 7, 'statusHistory should have exactly 7 transition entries');
    const finalHistory = dbDoc.statusHistory[dbDoc.statusHistory.length - 1];
    assert.ok(['completed', 'rejected'].includes(finalHistory.toStatus), 'Final history should be terminal state');
  });
});
