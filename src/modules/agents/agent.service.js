const httpStatus = require('http-status');
const mongoose = require('mongoose');
const ApiError = require('../../common/errors/api-error');
const RequestStatus = require('../../common/enums/request-status.enum');
const documentService = require('../documents/document.service');
const Request = require('../requests/request.model');
const requestService = require('../requests/request.service');

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
  return requestService.updateStatus(requestId, payload.status, agentUser, payload.reason);
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

module.exports = {
  getDashboardStats,
  getRequestDetails,
  listAssignedRequests,
  updateProgress,
  uploadAdditionalDocument,
};
