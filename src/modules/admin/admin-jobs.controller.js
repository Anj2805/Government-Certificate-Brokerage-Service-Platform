const httpStatus = require('http-status');
const { DeliveryJob, JobStatus } = require('../jobs/delivery-job.model');
const ApiError = require('../../common/errors/api-error');
const logger = require('../../config/logger');

const listDeadLetters = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
  const skip = (page - 1) * limit;

  const query = { status: JobStatus.DEAD_LETTER };

  if (req.query.channel) {
    query.channel = req.query.channel;
  }
  if (req.query.jobType) {
    query.jobType = req.query.jobType;
  }

  const [jobs, total] = await Promise.all([
    DeliveryJob.find(query)
      .select('-encryptedSecret -__v') // Never expose secret material
      .sort({ deadLetteredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DeliveryJob.countDocuments(query),
  ]);

  // Add replayable boolean flag
  const now = new Date();
  const safeJobs = jobs.map((job) => ({
    ...job,
    replayable: !job.secretExpiresAt || new Date(job.secretExpiresAt) > now,
  }));

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      jobs: safeJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

const getDeadLetterDetails = async (req, res) => {
  const job = await DeliveryJob.findOne({
    _id: req.params.jobId,
    status: JobStatus.DEAD_LETTER,
  }).select('-encryptedSecret -__v').lean();

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dead-letter job not found');
  }

  const now = new Date();
  job.replayable = !job.secretExpiresAt || new Date(job.secretExpiresAt) > now;

  res.status(httpStatus.OK).json({
    success: true,
    data: { job },
  });
};

const replayDeadLetter = async (req, res) => {
  // Replay requires an atomic update to safely transition out of DEAD_LETTER
  const job = await DeliveryJob.findOne({
    _id: req.params.jobId,
    status: JobStatus.DEAD_LETTER,
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dead-letter job not found');
  }

  const now = new Date();

  // If secret has expired, replay must fail safely
  if (job.secretExpiresAt && new Date(job.secretExpiresAt) <= now) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot replay job: underlying secret has expired');
  }

  // Atomically update
  const updatedJob = await DeliveryJob.findOneAndUpdate(
    { _id: job._id, status: JobStatus.DEAD_LETTER },
    {
      $set: {
        status: JobStatus.PENDING,
        availableAt: now,
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
        deadLetteredAt: null,
      },
      $inc: { attemptCount: -job.attemptCount } // Reset attempts to 0
    },
    { new: true }
  );

  if (!updatedJob) {
    throw new ApiError(httpStatus.CONFLICT, 'Job was already replayed or is no longer a dead-letter');
  }

  logger.info({ audit: true, eventType: 'DEAD_LETTER_REPLAYED', actorId: req.user.id, jobId: updatedJob._id }, 'Dead-letter job replayed');

  // Strip secret from response
  const safeJob = updatedJob.toObject();
  delete safeJob.encryptedSecret;

  res.status(httpStatus.OK).json({
    success: true,
    data: { job: safeJob, message: 'Job successfully scheduled for replay' },
  });
};

module.exports = {
  listDeadLetters,
  getDeadLetterDetails,
  replayDeadLetter,
};
