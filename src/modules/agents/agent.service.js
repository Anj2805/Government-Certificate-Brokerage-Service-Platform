const httpStatus = require('http-status');
const mongoose = require('mongoose');
const ApiError = require('../../common/errors/api-error');
const RequestStatus = require('../../common/enums/request-status.enum');
const documentService = require('../documents/document.service');
const Request = require('../requests/request.model');
const User = require('../users/user.model');
const requestService = require('../requests/request.service');
const storageService = require('../../services/storage.service');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const ensureAssignedRequest = async (requestId, agentId) => {
  const request = await Request.findOne({
    _id: requestId,
    assignedAgent: agentId,
  });

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assigned request not found');
  }

  return request;
};

const listAssignedRequests = async (query, agentUser) =>
  requestService.listRequests({
    query: {
      page: query.page || DEFAULT_PAGE,
      limit: query.limit || DEFAULT_LIMIT,
      status: query.status,
      serviceId: query.serviceId,
    },
    user: agentUser,
    scope: 'assigned',
  });

const getRequestDetails = async (requestId, agentUser) => {
  await ensureAssignedRequest(requestId, agentUser.id);
  return requestService.getRequestDetails(requestId, agentUser);
};

const updateProgress = async (requestId, payload, agentUser) => {
  await ensureAssignedRequest(requestId, agentUser.id);
  const { status, reason } = payload;
  
  switch(status) {
    case RequestStatus.UNDER_REVIEW:
      return requestService.startProcessing(requestId, agentUser, reason);
    case RequestStatus.CORRECTION_REQUIRED:
      return requestService.requestCorrection(requestId, agentUser, reason);
    case RequestStatus.APPROVED:
      return requestService.approveRequest(requestId, agentUser, reason);
    case RequestStatus.REJECTED:
      return requestService.rejectRequest(requestId, agentUser, reason);
    case RequestStatus.COMPLETED:
      // Fallback for completion if no delivery is required
      return requestService.verifyDelivery(requestId, agentUser, { verificationResult: 'PASSED', codCollected: true });
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status transition');
  }
};

const uploadAdditionalDocument = async ({ requestId, file, payload, agentUser }) => {
  const request = await ensureAssignedRequest(requestId, agentUser.id);

  const document = await documentService.uploadDocument({
    file,
    payload: {
      title: payload.title,
      documentType: payload.documentType,
      requestId,
      ownerUserId: request.citizen.toString(),
      assignedAgentId: agentUser.id,
    },
    user: agentUser,
  });

  request.documents.addToSet(document.id);
  await request.save();

  return document;
};

const getDashboardStats = async (agentId) => {
  const [metrics] = await Request.aggregate([
    {
      $match: {
        assignedAgent: new mongoose.Types.ObjectId(agentId),
      },
    },
    {
      $group: {
        _id: null,
        totalAssignedRequests: { $sum: 1 },
        inProgressRequests: {
          $sum: {
            $cond: [{ $eq: ['$status', RequestStatus.IN_PROGRESS] }, 1, 0],
          },
        },
        completedRequests: {
          $sum: {
            $cond: [{ $eq: ['$status', RequestStatus.COMPLETED] }, 1, 0],
          },
        },
        documentsRequiredRequests: {
          $sum: {
            $cond: [{ $eq: ['$status', RequestStatus.DOCUMENTS_REQUIRED] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalAssignedRequests: 1,
        inProgressRequests: 1,
        completedRequests: 1,
        documentsRequiredRequests: 1,
      },
    },
  ]);

  return {
    totalAssignedRequests: metrics?.totalAssignedRequests || 0,
    inProgressRequests: metrics?.inProgressRequests || 0,
    completedRequests: metrics?.completedRequests || 0,
    documentsRequiredRequests: metrics?.documentsRequiredRequests || 0,
  };
};

const getProfile = async (agentId) => {
  const agent = await User.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }
  return agent;
};

const updateProfile = async (agentId, payload) => {
  const agent = await User.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }

  // Explicit allowlist of fields
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'address', 'city', 
    'state', 'postalCode', 'preferredLanguage', 'languagesSupported'
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      agent[field] = payload[field];
    }
  }

  await agent.save();
  return agent;
};

const uploadProfilePhoto = async (agentId, file) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
  }

  const agent = await User.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }

  const oldPhotoKey = agent.profilePhoto;
  const extension = require('path').extname(file.originalname);
  const storageKey = await storageService.save(file.path, extension);

  agent.profilePhoto = storageKey;
  await agent.save();

  if (oldPhotoKey) {
    await storageService.delete(oldPhotoKey).catch(() => {});
  }

  return agent;
};

const removeProfilePhoto = async (agentId) => {
  const agent = await User.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }

  const oldPhotoKey = agent.profilePhoto;
  if (!oldPhotoKey) {
    return agent; // Nothing to remove
  }

  agent.profilePhoto = undefined;
  await agent.save();

  await storageService.delete(oldPhotoKey).catch(() => {});

  return agent;
};

const getProfilePhotoStrategy = async (agentId) => {
  const agent = await User.findById(agentId);
  if (!agent || !agent.profilePhoto) {
    return null;
  }
  // For profile photos we can just return the raw image name or 'profile.jpg'
  return storageService.getViewStrategy(agent.profilePhoto);
};

module.exports = {
  getDashboardStats,
  getRequestDetails,
  listAssignedRequests,
  updateProgress,
  uploadAdditionalDocument,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getProfilePhotoStrategy,
};
