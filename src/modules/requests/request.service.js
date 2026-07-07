const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const AgentStatus = require('../../common/enums/agent-status.enum');
const RequestStatus = require('../../common/enums/request-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const { generateRequestNumber } = require('../../common/utils/request-number.util');
const Document = require('../documents/document.model');
const Service = require('../services/service.model');
const User = require('../users/user.model');
const requestRepository = require('./request.repository');
const { assertTransitionAllowed } = require('./request.workflow');
const notificationService = require('../notifications/notification.service');
const NotificationType = require('../../common/enums/notification-type.enum');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const appendStatusHistory = (request, { fromStatus, toStatus, user, reason }) => {
  request.statusHistory.push({
    fromStatus,
    toStatus,
    changedBy: user.id,
    changedByRole: user.role,
    reason,
    changedAt: new Date(),
  });
};

const applyStatusSideEffects = (request, status) => {
  const now = new Date();

  if (status === RequestStatus.SUBMITTED && !request.submittedAt) {
    request.submittedAt = now;
  }

  if (status === RequestStatus.ASSIGNED && !request.assignedAt) {
    request.assignedAt = now;
  }

  if (status === RequestStatus.COMPLETED) {
    request.completedAt = now;
  }

  if (status === RequestStatus.REJECTED) {
    request.rejectedAt = now;
  }

  if (status === RequestStatus.CANCELLED) {
    request.cancelledAt = now;
  }
};

const transitionRequest = (request, toStatus, user, reason) => {
  assertTransitionAllowed({
    fromStatus: request.status,
    toStatus,
    role: user.role,
  });

  const fromStatus = request.status;
  request.status = toStatus;
  appendStatusHistory(request, { fromStatus, toStatus, user, reason });
  applyStatusSideEffects(request, toStatus);
};

const ensureRequestAccess = (request, user) => {
  if (user.role === UserRoles.ADMIN) {
    return;
  }

  if (user.role === UserRoles.AGENT && request.assignedAgent?.toString() === user.id) {
    return;
  }

  if (user.role === UserRoles.CITIZEN && request.citizen.toString() === user.id) {
    return;
  }

  throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
};

const ensureActiveService = async (serviceId) => {
  const service = await Service.findOne({
    _id: serviceId,
    isActive: true,
    deletedAt: null,
  });

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Active service not found');
  }

  return service;
};

const ensureAgentUser = async (agentId) => {
  const agent = await User.findOne({
    _id: agentId,
    role: UserRoles.AGENT,
    isActive: true,
    agentStatus: AgentStatus.APPROVED,
  });

  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Approved active agent not found');
  }

  return agent;
};

const ensureDocumentsAccessible = async ({ documentIds = [], userId }) => {
  if (!documentIds.length) {
    return;
  }

  const count = await Document.countDocuments({
    _id: { $in: documentIds },
    ownerUser: userId,
    deletedAt: null,
  });

  if (count !== documentIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more documents are invalid or not owned by the user');
  }
};

const buildListQuery = (query, user, scope) => {
  const dbQuery = {};

  if (query.status) {
    dbQuery.status = query.status;
  }

  if (query.serviceId) {
    dbQuery.service = query.serviceId;
  }

  if (scope === 'own') {
    dbQuery.citizen = user.id;
  } else if (scope === 'assigned') {
    dbQuery.assignedAgent = user.id;
  }

  if (query.search) {
    const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    dbQuery.$or = [
      { requestNumber: { $regex: escapedSearch, $options: 'i' } },
      { 'serviceSnapshot.serviceName': { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  if (query.timeFilter) {
    const now = new Date();
    if (query.timeFilter === 'Last 30 Days') {
      dbQuery.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (query.timeFilter === 'Last 6 Months') {
      dbQuery.createdAt = { $gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) };
    }
  }

  return dbQuery;
};

const createRequest = async (payload, user) => {
  const service = await ensureActiveService(payload.serviceId);
  await ensureDocumentsAccessible({ documentIds: payload.documents, userId: user.id });

  const initialStatus = payload.status || RequestStatus.DRAFT;
  const now = new Date();

  const request = await requestRepository.create({
    requestNumber: await generateRequestNumber(now),
    citizen: user.id,
    service: service.id,
    serviceSnapshot: {
      serviceName: service.name,
      category: service.category,
      estimatedProcessingDays: service.estimatedProcessingDays,
      serviceCharge: service.serviceCharge,
    },
    status: initialStatus,
    applicationData: payload.applicationData || {},
    notes: payload.notes,
    documents: payload.documents || [],
    submittedAt: initialStatus === RequestStatus.SUBMITTED ? now : undefined,
    statusHistory: [
      {
        toStatus: initialStatus,
        changedBy: user.id,
        changedByRole: user.role,
        reason: 'Request created',
        changedAt: now,
      },
    ],
  });

  return request;
};

const listRequests = async ({ query, user, scope }) => {
  const page = query.page || DEFAULT_PAGE;
  const limit = query.limit || DEFAULT_LIMIT;

  return requestRepository.findPaginated({
    query: buildListQuery(query, user, scope),
    page,
    limit,
  });
};

const getRequestDetails = async (requestId, user) => {
  const request = await requestRepository.findById(requestId)
    .populate('service', 'name category requiredDocuments estimatedProcessingDays serviceCharge')
    .populate('citizen', 'firstName lastName email role')
    .populate('assignedAgent', 'firstName lastName email role')
    .populate('documents', 'title documentType originalName filename mimeType size status createdAt');

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);

  return request;
};

const submitRequest = async (requestId, user, reason) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);
  transitionRequest(request, RequestStatus.SUBMITTED, user, reason);

  const savedRequest = await requestRepository.save(request);
  const eventId = savedRequest.statusHistory.length - 1;
  
  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_SUBMITTED,
    eventId
  });

  return savedRequest;
};

const cancelRequest = async (requestId, user, reason) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);
  transitionRequest(request, RequestStatus.CANCELLED, user, reason);

  const savedRequest = await requestRepository.save(request);
  const eventId = savedRequest.statusHistory.length - 1;

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_CANCELLED,
    eventId
  });

  return savedRequest;
};

const assignAgent = async (requestId, agentId, adminUser, reason) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  await ensureAgentUser(agentId);

  request.assignedAgent = agentId;
  transitionRequest(request, RequestStatus.ASSIGNED, adminUser, reason || 'Agent assigned');

  const savedRequest = await requestRepository.save(request);
  const eventId = savedRequest.statusHistory.length - 1;

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.AGENT_ASSIGNED,
    eventId
  });

  return savedRequest;
};

const updateStatus = async (requestId, status, user, reason) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);

  if (user.role === UserRoles.AGENT && request.assignedAgent?.toString() !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the assigned agent can update this request');
  }

  transitionRequest(request, status, user, reason);

  const savedRequest = await requestRepository.save(request);
  const eventId = savedRequest.statusHistory.length - 1;

  let type;
  switch (status) {
    case RequestStatus.IN_PROGRESS:
      type = NotificationType.REQUEST_IN_PROGRESS;
      break;
    case RequestStatus.DOCUMENTS_REQUIRED:
      type = NotificationType.DOCUMENTS_REQUIRED;
      break;
    case RequestStatus.COMPLETED:
      type = NotificationType.REQUEST_COMPLETED;
      break;
    case RequestStatus.REJECTED:
      type = NotificationType.REQUEST_REJECTED;
      break;
  }

  if (type) {
    await notificationService.createRequestNotification({
      recipientId: savedRequest.citizen,
      requestId: savedRequest._id,
      type,
      eventId
    });
  }

  return savedRequest;
};

const getRequestsSummary = async (user) => {
  if (user.role !== UserRoles.CITIZEN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only citizens can access requests summary');
  }
  return requestRepository.getSummary(user.id);
};

const attachDocument = async (requestId, documentId, user) => {
  if (user.role !== UserRoles.CITIZEN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only citizens can attach documents');
  }

  const request = await requestRepository.findById(requestId);
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);

  const validStatuses = [
    RequestStatus.DRAFT,
    RequestStatus.SUBMITTED,
    RequestStatus.ASSIGNED,
    RequestStatus.IN_PROGRESS,
    RequestStatus.DOCUMENTS_REQUIRED,
  ];

  if (!validStatuses.includes(request.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot attach documents to request in ${request.status} status`);
  }

  const document = await Document.findOne({ _id: documentId, deletedAt: null });
  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  if (document.ownerUser.toString() !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not own this document');
  }

  if (request.documents.some(docId => docId.toString() === documentId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Document is already attached to this request');
  }

  request.documents.push(documentId);
  await requestRepository.save(request);

  document.request = requestId;
  await document.save();

  return request;
};

module.exports = {
  assignAgent,
  cancelRequest,
  createRequest,
  getRequestDetails,
  listRequests,
  submitRequest,
  updateStatus,
  getRequestsSummary,
  attachDocument,
};
