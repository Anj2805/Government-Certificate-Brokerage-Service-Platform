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

test('Phase 3 - Forgot Password and Reset Password Flow', async (t) => {
  let server;
  let port;
  let API;
  
  let userEmail = `phase3_${Date.now()}@example.com`;
  let userPassword = 'Password123';
  let accessToken, refreshToken;
  let resetToken;
  let userId;

  t.before(async () => {
    // Connect to test DB
    const testDbUri = config.database.uri.includes('?') 
      ? config.database.uri.replace('?', '_test?')
      : config.database.uri + '_test';
    await mongoose.connect(testDbUri);
    
    // Clear jobs to prevent cross-test leakage
    await mongoose.connection.collection('deliveryjobs').deleteMany({});
    await mongoose.connection.collection('outboxevents').deleteMany({});
    
    // Start server on dynamic port
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

  await t.test('Register test user', async () => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Phase3',
        lastName: 'Test',
        email: userEmail,
        phone: `77${Date.now().toString().slice(-8)}`,
        password: userPassword,
        role: 'citizen'
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    accessToken = data.data.tokens.accessToken;
    refreshToken = data.data.tokens.refreshToken;
    userId = data.data.user._id;
  });

  await t.test('Forgot password for nonexistent email returns generic 200 and no token in response', async () => {
    emailService.clearCapturedPasswordResetMessages();
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /If an account exists/);
    assert.strictEqual(data.data, undefined); // Requirement 4
    
    const messages = emailService.getCapturedPasswordResetMessages();
    assert.strictEqual(messages.length, 0);
  });

  await t.test('Forgot password for inactive account returns generic 200', async () => {
    // Make user inactive
    await User.findByIdAndUpdate(userId, { isActive: false });
    
    emailService.clearCapturedPasswordResetMessages();
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /If an account exists/);
    assert.strictEqual(data.data, undefined); // Requirement 4
    
    const messages = emailService.getCapturedPasswordResetMessages();
    assert.strictEqual(messages.length, 0); // No email sent to inactive
    
    // Restore active state
    await User.findByIdAndUpdate(userId, { isActive: true });
  });

  await t.test('Forgot password for existing email returns same generic 200 and captures token', async () => {
    emailService.clearCapturedPasswordResetMessages();
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /If an account exists/);
    
    // Process the outbox queue
    while (await require('./src/workers/delivery.worker').runOnce()) {}

    const messages = emailService.getCapturedPasswordResetMessages();
    assert.strictEqual(messages.length, 1);
    assert.strictEqual(messages[0].to, userEmail);
    
    // Extract token from resetUrl
    const urlParts = messages[0].resetUrl.split('/');
    resetToken = urlParts[urlParts.length - 1];
    assert.ok(resetToken);
  });
  
  await t.test('Stored reset token is hashed (SHA-256) and not plaintext', async () => {
    const user = await User.findById(userId).select('+passwordResetTokenHash +passwordResetExpiresAt');
    assert.ok(user.passwordResetTokenHash);
    assert.notStrictEqual(user.passwordResetTokenHash, resetToken);
    assert.strictEqual(user.passwordResetTokenHash.length, 64); // SHA-256 hex is 64 chars
    assert.ok(user.passwordResetExpiresAt > new Date());
  });

  await t.test('New forgot request invalidates previous reset token', async () => {
    emailService.clearCapturedPasswordResetMessages();
    const userBefore = await User.findById(userId).select('+passwordResetTokenHash');
    const oldHash = userBefore.passwordResetTokenHash;
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    assert.strictEqual(res.status, 200);
    
    while (await require('./src/workers/delivery.worker').runOnce()) {}

    const messages = emailService.getCapturedPasswordResetMessages();
    assert.strictEqual(messages.length, 1);
    
    const newUrlParts = messages[0].resetUrl.split('/');
    resetToken = newUrlParts[newUrlParts.length - 1]; // Update resetToken to new one
    
    const userAfter = await User.findById(userId).select('+passwordResetTokenHash');
    assert.notStrictEqual(userAfter.passwordResetTokenHash, oldHash);
  });

  await t.test('Expired token rejected', async () => {
    // Manually expire the token in DB
    await User.findByIdAndUpdate(userId, { passwordResetExpiresAt: new Date(Date.now() - 10000) });
    
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      })
    });
    assert.strictEqual(res.status, 400);
    
    // Restore expiration to future
    await User.findByIdAndUpdate(userId, { passwordResetExpiresAt: new Date(Date.now() + 15 * 60000) });
  });

  await t.test('Invalid reset token fails', async () => {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid_token_1234567890123456789012345678901234',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /invalid or has expired/);
  });

  await t.test('Weak password rejected', async () => {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'weak',
        confirmPassword: 'weak'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(JSON.stringify(data), /between 8 and 128 characters/);
  });

  await t.test('Confirmation mismatch fails', async () => {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(JSON.stringify(data), /confirmPassword must match/);
  });

  await t.test('Same-as-current password fails', async () => {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: userPassword,
        confirmPassword: userPassword
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /different from current/);
  });

  await t.test('Valid reset succeeds and clears tokens', async () => {
    const newPassword = 'NewPassword123';
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword,
        confirmPassword: newPassword
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /successfully/);
    assert.strictEqual(data.data, undefined); // Requirement 24: No JWT in reset response
    
    // Verify DB fields are cleared
    const user = await User.findById(userId).select('+passwordResetTokenHash +passwordResetExpiresAt +refreshTokenHash');
    assert.strictEqual(user.passwordResetTokenHash, null);
    assert.strictEqual(user.passwordResetExpiresAt, null);
    assert.strictEqual(user.refreshTokenHash, undefined);
    
    // Token reuse fails
    const reuseRes = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword: 'AnotherPassword123', confirmPassword: 'AnotherPassword123' })
    });
    assert.strictEqual(reuseRes.status, 400);
    
    // Refreshing old token should fail
    const refreshRes = await fetch(`${API}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    assert.strictEqual(refreshRes.status, 401);
    
    // Old password fails
    const oldLoginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    });
    assert.strictEqual(oldLoginRes.status, 401);
    
    // New password succeeds
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: newPassword })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    accessToken = loginData.data.tokens.accessToken;
  });

  await t.test('Safe-user DTO never exposes reset fields', async () => {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    const returnedUser = data.data.user;
    assert.strictEqual(returnedUser.passwordResetTokenHash, undefined);
    assert.strictEqual(returnedUser.passwordResetExpiresAt, undefined);
    assert.strictEqual(returnedUser.password, undefined);
  });

  await t.test('Change password clears outstanding reset fields', async () => {
    // Manually set a reset token first
    await User.findByIdAndUpdate(userId, { 
      passwordResetTokenHash: 'dummyhash', 
      passwordResetExpiresAt: new Date(Date.now() + 60000) 
    });
    
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        currentPassword: 'NewPassword123',
        newPassword: 'ChangedPassword123',
        confirmPassword: 'ChangedPassword123'
      })
    });
    assert.strictEqual(res.status, 200);
    
    const user = await User.findById(userId).select('+passwordResetTokenHash +passwordResetExpiresAt');
    assert.strictEqual(user.passwordResetTokenHash, null);
    assert.strictEqual(user.passwordResetExpiresAt, null);
  });

  await t.test('Email delivery failure gracefully returns 200 (Outbox handles retries)', async () => {
    emailService.setSimulateFailure(true);
    
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.match(data.message, /If an account exists/);
    
    emailService.setSimulateFailure(false);
  });

  await t.test('Forgot password rate limiter activates', async () => {
    // Generate many requests
    let status429Seen = false;
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dummy@example.com' })
      });
      if (r.status === 429) status429Seen = true;
    }
    assert.ok(status429Seen);
  });
});
