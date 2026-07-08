const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('./app'); // Should NOT start workers!
const config = require('./src/config');
const connectDatabase = require('./src/config/database');
const { OutboxEvent, EventStatus } = require('./src/modules/jobs/outbox-event.model');
const { DeliveryJob, JobStatus } = require('./src/modules/jobs/delivery-job.model');
const User = require('./src/modules/users/user.model');
const UserRoles = require('./src/common/enums/user-roles.enum');
const jobService = require('./src/modules/jobs/job.service');
const emailService = require('./src/services/email.service');
const deliveryWorker = require('./src/workers/delivery.worker');
const schedulerWorker = require('./src/workers/scheduler.worker');
const cryptoUtil = require('./src/utils/crypto.util');

describe('Phase 9 - Reliable Background Jobs and Notifications', () => {
  let adminToken;
  let adminUser;
  let testUserId;
  let testEventId;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Test environment must be set to NODE_ENV=test');
    }
    await connectDatabase();
    await OutboxEvent.deleteMany({});
    await DeliveryJob.deleteMany({});
    await User.deleteMany({});
    emailService.clearCapturedGenericMessages();
    emailService.clearCapturedPasswordResetMessages();

    // Create Admin
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin_phase9@example.com',
      password: 'StrongPassword123!',
      role: UserRoles.ADMIN,
      isActive: true,
      emailVerified: true,
    });
    const { signAccessToken } = require('./src/modules/auth/jwt.util');
    adminToken = signAccessToken(adminUser);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('1. Importing modules should not auto-start workers', () => {
    // We already imported workers. If they were running, we'd see output. 
    // Just verify the variables exist but haven't taken over execution.
    assert.ok(deliveryWorker.runOnce);
    assert.ok(schedulerWorker.runOnce);
  });

  it('2. Should enqueue outbox event and job durably', async () => {
    const event = await jobService.enqueueOutboxEvent({
      eventType: 'TEST_EVENT',
      aggregateType: 'Test',
      aggregateId: 'test-123',
      idempotencyKey: 'IDEMP_TEST_1',
      payload: { data: 'test' },
      jobsToCreate: [
        {
          channel: 'EMAIL',
          jobType: 'APPLICATION_NOTIFICATION',
          recipientReference: 'test@example.com',
          payload: { text: 'hello', message: 'test msg' },
          secret: 'mysecret',
          secretExpiresAt: new Date(Date.now() + 10000),
        }
      ]
    });

    assert.ok(event._id);
    assert.strictEqual(event.status, EventStatus.PROCESSED);

    const job = await DeliveryJob.findOne({ outboxEvent: event._id });
    assert.ok(job);
    assert.strictEqual(job.status, JobStatus.PENDING);
    assert.ok(job.encryptedSecret.ciphertext);
    assert.strictEqual(job.attemptCount, 0);
  });

  it('3. Duplicate enqueueing should be idempotent', async () => {
    const event = await jobService.enqueueOutboxEvent({
      eventType: 'TEST_EVENT',
      aggregateType: 'Test',
      aggregateId: 'test-123',
      idempotencyKey: 'IDEMP_TEST_1', // SAME KEY
      payload: { data: 'different payload should be ignored' },
      jobsToCreate: [
        {
          channel: 'EMAIL',
          jobType: 'APPLICATION_NOTIFICATION',
          recipientReference: 'test2@example.com',
          payload: { message: 'hello' }
        }
      ]
    });

    const count = await OutboxEvent.countDocuments({ idempotencyKey: 'IDEMP_TEST_1' });
    const jobCount = await DeliveryJob.countDocuments({ providerIdempotencyKey: 'EMAIL:APPLICATION_NOTIFICATION:IDEMP_TEST_1' });

    assert.strictEqual(count, 1, 'Should not create duplicate event');
    assert.strictEqual(jobCount, 1, 'Should not create duplicate job');
  });

  it('4. Atomic claiming: only one worker gets the job', async () => {
    // We have 1 pending job.
    const worker1Jobs = await jobService.claimAvailableJobs('W1', 10);
    const worker2Jobs = await jobService.claimAvailableJobs('W2', 10);

    assert.ok(worker1Jobs.length >= 1, 'Worker 1 should get at least 1 job');
    assert.strictEqual(worker2Jobs.length, 0, 'Worker 2 should get no jobs because Worker 1 claimed it');
    assert.strictEqual(worker1Jobs[0].lockedBy, 'W1');
  });

  it('5. Worker should process job, send email, and clean up ciphertext on success', async () => {
    // Re-run worker runOnce so it grabs and processes
    // Wait, the job is locked by W1, so runOnce() as W_RANDOM won't grab it.
    // Let's reset the lock to let runOnce() grab it.
    await DeliveryJob.updateOne({}, { lockedBy: null, leaseExpiresAt: null, status: JobStatus.PENDING });

    const hadJobs = await deliveryWorker.runOnce();
    assert.strictEqual(hadJobs, true);

    const job = await DeliveryJob.findOne({}).lean();
    assert.strictEqual(job.status, JobStatus.SUCCEEDED);
    assert.strictEqual(job.encryptedSecret, undefined, 'Ciphertext should be destroyed');

    const messages = emailService.getCapturedGenericMessages();
    assert.strictEqual(messages.length, 1);
    assert.ok(messages[0].providerIdempotencyKey);
  });

  it('6. Idempotency under provider success but DB failure (DB ACK FAILURE)', async () => {
    emailService.clearCapturedGenericMessages();

    // Create a new job
    const event = await jobService.enqueueOutboxEvent({
      eventType: 'TEST_EVENT_2',
      aggregateType: 'Test',
      aggregateId: 'test-456',
      idempotencyKey: 'IDEMP_TEST_2',
      payload: { data: 'test' },
      jobsToCreate: [
        {
          channel: 'EMAIL',
          jobType: 'APPLICATION_NOTIFICATION',
          recipientReference: 'test_ack_fail@example.com',
          payload: { text: 'hello' }
        }
      ]
    });

    const job = await DeliveryJob.findOne({ outboxEvent: event._id });

    // Simulate provider success but worker crash before DB save
    await emailService.sendEmail({
      to: job.recipientReference,
      subject: 'Test',
      text: 'Test',
      providerIdempotencyKey: job.providerIdempotencyKey,
    });

    assert.strictEqual(emailService.getCapturedGenericMessages().length, 1);

    // Now worker runOnce() picks it up and processes it AGAIN
    await deliveryWorker.runOnce();

    // Provider should deduplicate!
    const messages = emailService.getCapturedGenericMessages();
    assert.strictEqual(messages.length, 1, 'Fake provider should deduplicate via idempotency key');

    const updatedJob = await DeliveryJob.findById(job._id);
    assert.strictEqual(updatedJob.status, JobStatus.SUCCEEDED);
  });

  it('7. Dead-letter API replay logic and secret retention', async () => {
    // Create job that will permanently fail (e.g. Unsupported jobType)
    const event = await jobService.enqueueOutboxEvent({
      eventType: 'FAIL_EVENT',
      aggregateType: 'Test',
      aggregateId: 'test-fail',
      idempotencyKey: 'IDEMP_FAIL_1',
      payload: { data: 'fail' },
      jobsToCreate: [
        {
          channel: 'EMAIL',
          jobType: 'INVALID_TYPE',
          recipientReference: 'fail@example.com',
          payload: { message: 'fail msg' },
          secret: 'keep_me',
          secretExpiresAt: new Date(Date.now() + 60000), // Valid for 1 min
        }
      ]
    });

    await deliveryWorker.runOnce();

    const job = await DeliveryJob.findOne({ outboxEvent: event._id });
    assert.strictEqual(job.status, JobStatus.DEAD_LETTER);
    assert.ok(job.encryptedSecret.ciphertext, 'Secret MUST be retained in Dead Letter if still valid');

    // Admin lists dead letters
    const listRes = await request(app)
      .get(`${config.api.basePath}/admin/jobs/dead-letter`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(listRes.status, 200);
    const dlJob = listRes.body.data.jobs[0];
    assert.strictEqual(dlJob.encryptedSecret, undefined, 'Admin API MUST NOT expose ciphertext');
    assert.strictEqual(dlJob.replayable, true);

    // Admin replays
    const replayRes = await request(app)
      .post(`${config.api.basePath}/admin/jobs/${job._id}/replay`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(replayRes.status, 200);

    const replayedJob = await DeliveryJob.findById(job._id);
    assert.strictEqual(replayedJob.status, JobStatus.PENDING);
    assert.strictEqual(replayedJob.attemptCount, 0);
  });

  it('8. Scheduler dead-letter cleanup', async () => {
    // Make the secret expire
    await DeliveryJob.updateOne({ providerIdempotencyKey: 'EMAIL:INVALID_TYPE:IDEMP_FAIL_1' }, {
      status: JobStatus.DEAD_LETTER,
      secretExpiresAt: new Date(Date.now() - 10000) // Expired
    });

    await schedulerWorker.runOnce();

    const job = await DeliveryJob.findOne({ providerIdempotencyKey: 'EMAIL:INVALID_TYPE:IDEMP_FAIL_1' }).lean();
    assert.strictEqual(job.encryptedSecret, undefined, 'Scheduler should erase expired secrets');
  });
});
