const { describe, it, before, after } = require('node:test');
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');

// Need to set NODE_ENV=test and source .env.test ideally, but assuming it's loaded via npm test or we load it here
if (process.env.NODE_ENV !== 'test') {
  console.log('Skipping phase 8 tests: NODE_ENV is not test');
  process.exit(0);
}

const app = require('../../app');
const User = require('../../src/modules/users/user.model');
const Service = require('../../src/modules/services/service.model');
const Request = require('../../src/modules/requests/request.model');
const Document = require('../../src/modules/documents/document.model');
const Certificate = require('../../src/modules/certificates/certificate.model');
const { signAccessToken } = require('../../src/modules/auth/jwt.util');
const config = require('../../src/config');
const uploadConfig = require('../../src/config/upload');
const DocumentStatus = require('../../src/common/enums/document-status.enum');
const RequestStatus = require('../../src/common/enums/request-status.enum');

const TEST_EMAIL_CITIZEN = 'citizen.doc@test.com';
const TEST_EMAIL_AGENT = 'agent.doc@test.com';
const TEST_EMAIL_ADMIN = 'admin.doc@test.com';
const TEST_PASSWORD = 'Password123!';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Phase 8 - Document Lifecycle and Certificate Issuance', async () => {
  let citizenToken, agentToken, adminToken;
  let citizenId, agentId, adminId;
  let serviceId;
  let requestId;
  let documentId;
  let certificateId;
  
  const testPdfPath = path.join(__dirname, 'test-doc.pdf');
  const testImgPath = path.join(__dirname, 'test-img.png');
  const invalidFilePath = path.join(__dirname, 'test-invalid.txt');

  before(async () => {
    // Connect DB
    require('dotenv').config({ path: '.env.test' });
    await mongoose.connect(process.env.MONGODB_URI);

    // Create test files
    await fs.writeFile(testPdfPath, Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A])); // %PDF-1.4
    await fs.writeFile(testImgPath, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00])); // PNG
    await fs.writeFile(invalidFilePath, Buffer.from('This is a text file, not a PDF.')); // Invalid magic bytes

    // Clean up
    await User.deleteMany({ email: { $in: [TEST_EMAIL_CITIZEN, TEST_EMAIL_AGENT, TEST_EMAIL_ADMIN] } });
    await Service.deleteMany({ name: 'Document Test Service' });
    
    // Create Users
    const citizen = await User.create({
      firstName: 'Citizen',
      lastName: 'Doc',
      email: TEST_EMAIL_CITIZEN,
      password: TEST_PASSWORD,
      role: 'citizen',
      emailVerified: true,
      isActive: true,
    });
    citizenId = citizen._id.toString();
    citizenToken = signAccessToken({ id: citizenId, role: 'citizen' });

    const agent = await User.create({
      firstName: 'Agent',
      lastName: 'Doc',
      email: TEST_EMAIL_AGENT,
      password: TEST_PASSWORD,
      role: 'agent',
      emailVerified: true,
      isActive: true,
      agentStatus: 'approved',
    });
    agentId = agent._id.toString();
    agentToken = signAccessToken({ id: agentId, role: 'agent' });
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Doc',
      email: TEST_EMAIL_ADMIN,
      password: TEST_PASSWORD,
      role: 'admin',
      emailVerified: true,
      isActive: true,
    });
    adminId = admin._id.toString();
    adminToken = signAccessToken({ id: adminId, role: 'admin' });

    // Create Service
    const service = await Service.create({
      name: 'Document Test Service',
      description: 'Test service with required documents',
      category: 'certificates',
      requiredDocuments: ['identity_proof'],
      estimatedProcessingDays: 5,
      serviceCharge: 100,
      createdBy: adminId,
    });
    serviceId = service._id.toString();
  });

  after(async () => {
    // Clean up temp files
    await fs.unlink(testPdfPath).catch(() => {});
    await fs.unlink(testImgPath).catch(() => {});
    await fs.unlink(invalidFilePath).catch(() => {});
    
    await mongoose.disconnect();
  });

  it('1. Should block document upload with invalid magic bytes', async () => {
    const res = await request(app)
      .post(`${config.api.basePath}/documents`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Identity Proof')
      .field('documentType', 'identity_proof')
      .attach('document', invalidFilePath, { filename: 'test-invalid.pdf', contentType: 'application/pdf' });

    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /Invalid file signature/);
  });

  it('2. Should upload valid document successfully', async () => {
    const res = await request(app)
      .post(`${config.api.basePath}/documents`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Identity Proof')
      .field('documentType', 'identity_proof')
      .attach('document', testPdfPath, { filename: 'id.pdf', contentType: 'application/pdf' });

    if (res.status !== 201) {
      console.log('Upload failed:', res.body);
    }
    assert.strictEqual(res.status, 201);
    documentId = res.body.data.document._id;
    assert.strictEqual(res.body.data.document.status, DocumentStatus.PENDING);
    
    // Verify file exists in storage
    const doc = await Document.findById(documentId);
    const storagePath = path.join(uploadConfig.storageRoot, doc.path);
    await fs.access(storagePath); // Should not throw
  });

  it('3. Should create request and submit successfully', async () => {
    const createRes = await request(app)
      .post(`${config.api.basePath}/requests`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        serviceId,
        documents: [documentId],
      });
    
    assert.strictEqual(createRes.status, 201);
    requestId = createRes.body.data.request._id;

    // Submit Request (This should actually fail if we check requirements at submit, but for now we check at approve)
    const submitRes = await request(app)
      .post(`${config.api.basePath}/requests/${requestId}/submit`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .expect(200);

    assert.strictEqual(submitRes.body.data.request.status, RequestStatus.SUBMITTED);
  });

  it('4. Should assign agent to request', async () => {
    const assignRes = await request(app)
      .post(`${config.api.basePath}/requests/admin/${requestId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ agentId });

    if (assignRes.status !== 200) console.log('Assign failed:', assignRes.body);
    assert.strictEqual(assignRes.status, 200);
  });

  it('5. Agent should be able to reject a document', async () => {
    const rejectRes = await request(app)
      .patch(`${config.api.basePath}/documents/${documentId}/reject`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ rejectionReason: 'Image too blurry' });

    if (rejectRes.status !== 200) console.log('Reject failed:', rejectRes.body);
    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.data.document.status, DocumentStatus.REJECTED);
  });

  it('6. Citizen should be able to replace rejected document', async () => {
    const replaceRes = await request(app)
      .post(`${config.api.basePath}/documents/${documentId}/replace`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Identity Proof Updated')
      .attach('document', testPdfPath, { filename: 'id2.pdf', contentType: 'application/pdf' });

    if (replaceRes.status !== 201) console.log('Replace failed:', replaceRes.body);
    assert.strictEqual(replaceRes.status, 201);
    const newDocId = replaceRes.body.data.document._id;

    // Check old document is superseded
    const oldDoc = await Document.findById(documentId);
    assert.strictEqual(oldDoc.status, DocumentStatus.SUPERSEDED);
    assert.strictEqual(oldDoc.isSuperseded, true);
    assert.strictEqual(oldDoc.replacedBy.toString(), newDocId);

    documentId = newDocId; // Update reference for next tests
  });

  it('7. Agent should accept documents and approve request', async () => {
    // Accept identity proof
    await request(app)
      .patch(`${config.api.basePath}/documents/${documentId}/accept`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    // Upload address proof directly
    const uploadRes = await request(app)
      .post(`${config.api.basePath}/documents`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Address Proof')
      .field('documentType', 'address_proof')
      .field('requestId', requestId)
      .attach('document', testImgPath, { filename: 'address.png', contentType: 'image/png' });

    const addrDocId = uploadRes.body.data.document._id;

    // Accept address proof
    await request(app)
      .patch(`${config.api.basePath}/documents/${addrDocId}/accept`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    // Start processing
    await request(app)
      .post(`${config.api.basePath}/requests/agent/${requestId}/start-processing`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    // Approve Request
    const approveRes = await request(app)
      .post(`${config.api.basePath}/requests/agent/${requestId}/approve`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({});
      
    if (approveRes.status !== 200) console.log('Approve failed:', approveRes.body);
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.body.data.request.status, RequestStatus.COMPLETED);
  });

  it('8. Should have generated a certificate upon approval', async () => {
    const certs = await Certificate.find({ request: requestId });
    assert.strictEqual(certs.length, 1);
    
    certificateId = certs[0].publicVerificationId;
    assert.ok(certs[0].integrityHash);
  });

  it('9. Should allow public verification of certificate', async () => {
    const verifyRes = await request(app)
      .get(`${config.api.basePath}/certificates/verify/${certificateId}`)
      .expect(200);

    assert.strictEqual(verifyRes.body.data.valid, true);
    assert.strictEqual(verifyRes.body.data.integrityVerified, true);
    assert.strictEqual(verifyRes.body.data.status, 'ACTIVE');
  });

  it('10. Should allow authorized download of certificate PDF', async () => {
    const downloadRes = await request(app)
      .get(`${config.api.basePath}/certificates/${certificateId}/download`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .expect(200);

    assert.strictEqual(downloadRes.headers['content-type'], 'application/pdf');
    // Check it starts with PDF magic bytes (PDF stream from PDFKit)
    assert.ok(downloadRes.body instanceof Buffer);
    assert.strictEqual(downloadRes.body.slice(0, 4).toString(), '%PDF');
  });

  it('11. Should be idempotent under concurrent certificate generation', async () => {
    // Attempt concurrent approvals
    const approvePromises = [
      request(app)
        .post(`${config.api.basePath}/requests/agent/${requestId}/approve`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({}),
      request(app)
        .post(`${config.api.basePath}/requests/agent/${requestId}/approve`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({}),
      request(app)
        .post(`${config.api.basePath}/requests/agent/${requestId}/approve`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({}),
    ];

    await Promise.all(approvePromises);

    const Certificate = mongoose.model('Certificate');
    const count = await Certificate.countDocuments({ request: requestId });
    assert.strictEqual(count, 1, 'Concurrent approvals should result in exactly one certificate');
  });
});
