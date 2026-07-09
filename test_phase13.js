const test = require('node:test');
const assert = require('node:assert');

const connectDatabase = require('./src/config/database');
const mongoose = require('mongoose');

test('Phase 13 - Vercel Serverless Architecture Verification', async (t) => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Test environment must be set to NODE_ENV=test');
  }

  await t.test('1. MongoDB connection caching (Serverless safety)', async () => {
    const conn1 = await connectDatabase();
    const conn2 = await connectDatabase();
    
    assert.strictEqual(conn1, conn2, 'Subsequent connectDatabase calls should return the cached connection');
    assert.strictEqual(mongoose.connection.readyState, 1, 'Mongoose should be connected');
  });

  await t.test('2. Protected Cron Endpoint Authorization', async () => {
    const cronHandler = require('./api/cron');
    
    const reqUnauthorized = {
      method: 'GET',
      url: '/api/cron',
      headers: { authorization: 'Bearer WRONG' }
    };
    const resUnauthorized = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; return this; }
    };
    
    await cronHandler(reqUnauthorized, resUnauthorized);
    assert.strictEqual(resUnauthorized.statusCode, 401, 'Cron endpoint should reject unauthorized requests');
    
    const reqAuthorized = {
      method: 'GET',
      url: '/api/cron',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
    };
    const resAuthorized = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; return this; }
    };
    
    await cronHandler(reqAuthorized, resAuthorized);
    assert.strictEqual(resAuthorized.statusCode, 200, 'Cron endpoint should accept authorized requests');
    
    const data = resAuthorized.data;
    assert.strictEqual(data.success, true);
  });
  
  await t.test('3. Bounded worker execution', async () => {
    const { deliveryWorker, schedulerWorker } = require('./src/workers');
    
    // Test that runOnce completes synchronously/without hanging
    const deliveryResult = await deliveryWorker.runOnce();
    const schedulerResult = await schedulerWorker.runOnce();
    
    assert.ok(deliveryResult !== undefined, 'Delivery worker runOnce should return a boolean');
    assert.strictEqual(schedulerResult, undefined, 'Scheduler runOnce is void but finishes safely');
  });

  await t.test('4. Storage Adapter local filesystem logic', async () => {
    const storageService = require('./src/services/storage.service');
    
    // We test whatever provider is currently configured (usually local)
    const strategyLocal = await storageService.getDownloadStrategy('fake-key.pdf', 'file.pdf');
    assert.strictEqual(strategyLocal.type, process.env.STORAGE_PROVIDER === 's3' ? 'redirect' : 'local');
  });
});
