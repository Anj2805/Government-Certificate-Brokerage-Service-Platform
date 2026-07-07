const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}
const app = require('./app');
const config = require('./src/config');
const emailService = require('./src/services/email.service');
const User = require('./src/modules/users/user.model');
const { signAccessToken } = require('./src/modules/auth/jwt.util');
const UserRoles = require('./src/common/enums/user-roles.enum');
const AgentStatus = require('./src/common/enums/agent-status.enum');
const Permissions = require('./src/common/enums/permissions.enum');

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

test('Phase 4 - Email Verification Flow', async (t) => {
  let server;
  let port;
  let API;
  
  let citizenEmail = `citizen4_${Date.now()}@example.com`;
  let agentEmail = `agent4_${Date.now()}@example.com`;
  let testPassword = 'Password123';
  
  let citizenToken, citizenId, citizenAccessToken, citizenRefreshToken;
  let agentToken, agentId, agentAccessToken;

  t.before(async () => {
    // DB is already configured with _test suffix in config or env
    await mongoose.connect(config.database.uri);
    
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        API = `http://localhost:${port}/api/v1`;
        resolve();
      });
    });
  });

  t.after(async () => {
    await mongoose.disconnect();
    server.close();
  });

  await t.test('New Citizen registration sets emailVerified false and captures email', async () => {
    emailService.clearCapturedVerificationMessages();
    
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Citizen',
        lastName: 'Test',
        email: citizenEmail,
        password: testPassword,
        role: 'citizen'
      })
    });
    
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    
    citizenId = data.data.user._id || data.data.user.id;
    citizenAccessToken = data.data.tokens.accessToken;
    citizenRefreshToken = data.data.tokens.refreshToken;
    
    assert.strictEqual(data.data.user.emailVerified, false);
    assert.strictEqual(data.data.user.emailVerificationTokenHash, undefined);
    
    const messages = emailService.getCapturedVerificationMessages();
    assert.strictEqual(messages.length, 1);
    
    const urlParts = messages[0].verificationUrl.split('/');
    citizenToken = urlParts[urlParts.length - 1];
  });

  await t.test('New Agent registration sets emailVerified false and remains pending', async () => {
    emailService.clearCapturedVerificationMessages();
    
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Agent',
        lastName: 'Test',
        email: agentEmail,
        password: testPassword,
        role: 'agent'
      })
    });
    
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    
    agentId = data.data.user._id || data.data.user.id;
    agentAccessToken = data.data.tokens.accessToken;
    
    assert.strictEqual(data.data.user.emailVerified, false);
    assert.strictEqual(data.data.user.agentStatus, 'pending');
    
    const messages = emailService.getCapturedVerificationMessages();
    assert.strictEqual(messages.length, 1);
    
    const urlParts = messages[0].verificationUrl.split('/');
    agentToken = urlParts[urlParts.length - 1];
  });

  await t.test('Verification token stored as SHA-256 hash', async () => {
    const user = await User.findById(citizenId).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
    assert.ok(user.emailVerificationTokenHash);
    assert.notStrictEqual(user.emailVerificationTokenHash, citizenToken);
    assert.strictEqual(user.emailVerificationTokenHash.length, 64);
    assert.ok(user.emailVerificationExpiresAt > new Date());
  });

  await t.test('Unverified Citizen can access draft endpoints but cannot submit', async () => {
    // Fake submit since we don't have a full service seeded in this basic test setup
    const res = await fetch(`${API}/requests/fake_id/submit`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenAccessToken}`
      }
    });
    
    // It should hit the requireVerifiedEmail middleware before the controller
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.match(data.message, /Email verification is required/);
  });

  await t.test('Unverified+pending Agent blocked from operational API', async () => {
    const res = await fetch(`${API}/agents/requests`, {
      headers: { Authorization: `Bearer ${agentAccessToken}` }
    });
    
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.match(data.message, /Email verification is required/);
  });

  await t.test('Valid verification token succeeds', async () => {
    const res = await fetch(`${API}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: citizenToken })
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /Email verified successfully/);
    assert.strictEqual(data.data, undefined); // No JWTs
    
    const user = await User.findById(citizenId).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
    assert.strictEqual(user.emailVerified, true);
    assert.ok(user.emailVerifiedAt);
    assert.strictEqual(user.emailVerificationTokenHash, null);
    assert.strictEqual(user.emailVerificationExpiresAt, null);
  });

  await t.test('Verification token reuse fails', async () => {
    const res = await fetch(`${API}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: citizenToken })
    });
    
    assert.strictEqual(res.status, 400);
  });

  await t.test('Invalid verification token fails', async () => {
    const res = await fetch(`${API}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid_token_123456789012345678901234567890' })
    });
    
    assert.strictEqual(res.status, 400);
  });

  await t.test('Resend verification for verified account returns generic 200', async () => {
    emailService.clearCapturedVerificationMessages();
    const res = await fetch(`${API}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: citizenEmail })
    });
    
    assert.strictEqual(res.status, 200);
    const messages = emailService.getCapturedVerificationMessages();
    assert.strictEqual(messages.length, 0); // Should not resend if verified
  });

  await t.test('New resend invalidates previous verification token for Agent', async () => {
    emailService.clearCapturedVerificationMessages();
    
    const userBefore = await User.findById(agentId).select('+emailVerificationTokenHash');
    const oldHash = userBefore.emailVerificationTokenHash;
    
    const res = await fetch(`${API}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: agentEmail })
    });
    
    assert.strictEqual(res.status, 200);
    
    const userAfter = await User.findById(agentId).select('+emailVerificationTokenHash');
    assert.notStrictEqual(userAfter.emailVerificationTokenHash, oldHash);
    
    const messages = emailService.getCapturedVerificationMessages();
    assert.strictEqual(messages.length, 1);
    
    const urlParts = messages[0].verificationUrl.split('/');
    agentToken = urlParts[urlParts.length - 1]; // update agentToken
  });

  await t.test('Resend nonexistent email returns generic 200', async () => {
    emailService.clearCapturedVerificationMessages();
    const res = await fetch(`${API}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' })
    });
    
    assert.strictEqual(res.status, 200);
    const messages = emailService.getCapturedVerificationMessages();
    assert.strictEqual(messages.length, 0);
  });

  await t.test('Agent verifies email but remains pending and blocked', async () => {
    const res = await fetch(`${API}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: agentToken })
    });
    assert.strictEqual(res.status, 200);
    
    const user = await User.findById(agentId);
    assert.strictEqual(user.emailVerified, true);
    assert.strictEqual(user.agentStatus, 'pending'); // Ensure it didn't approve
    
    const agentRes = await fetch(`${API}/agents/requests`, {
      headers: { Authorization: `Bearer ${agentAccessToken}` }
    });
    assert.strictEqual(agentRes.status, 403);
    const data = await agentRes.json();
    // It should now throw the ensureApprovedAgent error
    assert.match(data.message, /Your agent account is pending approval/);
  });

  await t.test('Email delivery failure gracefully clears fields and returns 200 in resend', async () => {
    // Demote agent back to unverified to test resend failure
    await User.findByIdAndUpdate(agentId, { emailVerified: false });
    
    emailService.setSimulateFailure(true);
    
    const res = await fetch(`${API}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: agentEmail })
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /If an eligible account exists/);
    
    const user = await User.findById(agentId).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
    assert.strictEqual(user.emailVerificationTokenHash, null);
    assert.strictEqual(user.emailVerificationExpiresAt, null);
    
    emailService.setSimulateFailure(false);
  });

  await t.test('/auth/me returns emailVerified', async () => {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${citizenAccessToken}` }
    });
    const data = await res.json();
    assert.strictEqual(data.data.user.emailVerified, true);
    assert.strictEqual(data.data.user.emailVerificationTokenHash, undefined);
  });
  
  await t.test('Resend rate limiter activates', async () => {
    let status429Seen = false;
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${API}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'spam@example.com' })
      });
      if (r.status === 429) status429Seen = true;
    }
    assert.ok(status429Seen);
  });
});
