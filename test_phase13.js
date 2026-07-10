const test = require('node:test');
const assert = require('node:assert');

const connectDatabase = require('./src/config/database');
const mongoose = require('mongoose');
const DocumentStatus = require('./src/common/enums/document-status.enum');
const UserRoles = require('./src/common/enums/user-roles.enum');
const RequestStatus = require('./src/common/enums/request-status.enum');

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

  await t.test('5. Legacy local documents are not silently treated as S3 objects', async () => {
    const User = require('./src/modules/users/user.model');
    const Service = require('./src/modules/services/service.model');
    const Request = require('./src/modules/requests/request.model');
    const Document = require('./src/modules/documents/document.model');
    const documentService = require('./src/modules/documents/document.service');

    const suffix = Date.now();
    const citizen = await User.create({
      firstName: 'Phase',
      lastName: 'Citizen',
      email: `phase13-citizen-${suffix}@example.com`,
      phone: '0000000000',
      password: 'Password123!',
      role: UserRoles.CITIZEN,
    });

    const agent = await User.create({
      firstName: 'Phase',
      lastName: 'Agent',
      email: `phase13-agent-${suffix}@example.com`,
      phone: '1111111111',
      password: 'Password123!',
      role: UserRoles.AGENT,
    });

    const service = await Service.create({
      name: `Phase 13 Service ${suffix}`,
      description: 'Temporary service for compatibility verification',
      category: 'verification',
      requiredDocuments: ['identity-proof'],
      estimatedProcessingDays: 3,
      serviceCharge: 0,
      createdBy: citizen._id,
    });

    const request = await Request.create({
      requestNumber: `P13-${suffix}`,
      citizen: citizen._id,
      service: service._id,
      serviceSnapshot: {
        serviceName: service.name,
        category: service.category,
        estimatedProcessingDays: service.estimatedProcessingDays,
        serviceCharge: service.serviceCharge,
        requiredDocuments: service.requiredDocuments,
      },
      assignedAgent: agent._id,
      status: RequestStatus.DRAFT,
      applicationData: {},
    });

    const document = await Document.create({
      title: 'Legacy local document',
      documentType: 'identity-proof',
      originalName: 'legacy.pdf',
      filename: `legacy-${suffix}.pdf`,
      mimeType: 'application/pdf',
      size: 12,
      hash: 'd41d8cd98f00b204e9800998ecf8427e',
      path: `legacy-${suffix}.pdf`,
      uploadedBy: citizen._id,
      ownerUser: citizen._id,
      request: request._id,
      status: DocumentStatus.PENDING,
      storageProvider: 'local',
    });

    try {
      process.env.STORAGE_PROVIDER = 's3';
      await assert.rejects(
        () => documentService.downloadDocument(document._id, { id: citizen._id.toString(), role: UserRoles.CITIZEN }),
        (error) => {
          assert.ok(error);
          assert.ok(error.statusCode === 400 || error.status === 400 || /storage provider|migration/i.test(error.message || ''));
          return true;
        }
      );
    } finally {
      process.env.STORAGE_PROVIDER = 'local';
      await Promise.allSettled([
        User.deleteMany({ _id: { $in: [citizen._id, agent._id] } }),
        Service.deleteOne({ _id: service._id }),
        Request.deleteOne({ _id: request._id }),
        Document.deleteOne({ _id: document._id }),
      ]);
    }
  });
});
