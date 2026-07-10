const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const API_BASE = 'http://localhost:5006/api/v1';

let serverProcess;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('Phase 6 - Security and Hardening Verification', async (t) => {
  t.before(async () => {
    // Start server on port 5006
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: 5006, NODE_ENV: 'test', REQUEST_BODY_LIMIT: '10kb' },
      stdio: 'ignore'
    });
    
    // Wait for server to start
    for (let i = 0; i < 20; i++) {
      try {
        await fetch(`${API_BASE.replace('/api/v1', '')}/`);
        break;
      } catch (err) {
        await sleep(500);
      }
    }
  });

  t.after(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  await t.test('Security Headers are present', async () => {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/`);
    assert.strictEqual(res.headers.get('x-dns-prefetch-control'), 'off');
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.strictEqual(res.headers.get('content-security-policy') !== null, true);
    assert.ok(res.headers.get('x-request-id'));
  });

  await t.test('CORS preflight and allowed origins', async () => {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  });

  await t.test('CORS rejected origin', async () => {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/`, {
      headers: {
        'Origin': 'http://malicious.com'
      }
    });
    // CORS middleware either returns 403 or blocks
    // express cors might return 500 or just block if not allowed
    // Actually the security.middleware.js throws ApiError(403)
    assert.strictEqual(res.status, 403);
  });

  await t.test('Request Body Size Limit', async () => {
    // Limit is 10kb
    const largeBody = { data: 'a'.repeat(20000) }; // 20kb
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largeBody)
    });
    assert.strictEqual(res.status, 413); // Payload Too Large
  });

  await t.test('Auth Rate Limiter blocks after 10 requests', async () => {
    let status;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
      });
      status = res.status;
    }
    assert.strictEqual(status, 429);
  });

  await t.test('Validation of Request - Malformed Body', async () => {
    // Missing required fields
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    // This goes to forgotPasswordLimiter which hasn't been exhausted yet
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.message, 'Request validation failed');
  });
  
  await t.test('Production Error does not leak stack trace', async () => {
    // Start server in production mode on port 5007
    const prodProcess = spawn('node', ['server.js'], {
      env: { 
        ...process.env, 
        PORT: 5007, 
        NODE_ENV: 'production', 
        REQUEST_BODY_LIMIT: '10kb', 
        MONGODB_URI: process.env.MONGODB_URI,
        DELIVERY_SECRET_ENCRYPTION_KEY: '12345678901234567890123456789012'
      },
      stdio: 'ignore'
    });
    
    // Wait for server to start
    for (let i = 0; i < 20; i++) {
      try {
        await fetch('http://localhost:5007/');
        break;
      } catch (err) {
        await sleep(500);
      }
    }

    const res = await fetch(`http://localhost:5007/api/v1/services/invalid_id`); 
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(!body.stack);

    prodProcess.kill();
  });
});
