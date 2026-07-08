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
const {
  assertTransitionAllowed,
  terminalStatuses,
} = require('./request.workflow');
const notificationService = require('../notifications/notification.service');
const NotificationType = require('../../common/enums/notification-type.enum');
const logger = require('../../config/logger');

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

  const agentId = request.assignedAgent?._id ? request.assignedAgent._id.toString() : request.assignedAgent?.toString();
  if (user.role === UserRoles.AGENT && agentId === user.id) {
    return;
  }

  const citizenId = request.citizen?._id ? request.citizen._id.toString() : request.citizen?.toString();
  if (user.role === UserRoles.CITIZEN && citizenId === user.id) {
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

const createRequest = async (payload, user, reqId) => {
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
        fromStatus: undefined,
        toStatus: initialStatus,
        changedBy: user.id,
        changedByRole: user.role,
        reason: 'Request created',
        changedAt: now,
      },
    ],
  });

  logger.info({ audit: true, eventType: 'APPLICATION_DRAFT_CREATED', requestId: reqId, actorId: user.id, role: user.role, applicationNumber: request.requestNumber }, 'Draft application created');

  return request;
};

const updateDraft = async (requestId, payload, user, reqId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  ensureRequestAccess(request, user);

  if (request.status !== RequestStatus.DRAFT && request.status !== RequestStatus.DOCUMENTS_REQUIRED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update application in current status');
  }

  // Explicit allowlisting
  if (payload.applicationData) request.applicationData = payload.applicationData;
  if (payload.notes !== undefined) request.notes = payload.notes;

  if (payload.documents) {
    await ensureDocumentsAccessible({ documentIds: payload.documents, userId: user.id });
    request.documents = payload.documents;
  }

  const savedRequest = await requestRepository.save(request);
  logger.info({ audit: true, eventType: 'APPLICATION_UPDATED', requestId: reqId, actorId: user.id, role: user.role, applicationNumber: request.requestNumber }, 'Application draft updated');

  return savedRequest;
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

const submitRequest = async (requestId, user, reason, reqId) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);

  // Need to ensure application data is valid if required, but currently no specific service requirements in payload.
  // Generate application number if not present
  if (!request.requestNumber) {
    request.requestNumber = await generateRequestNumber(new Date());
  }

  transitionRequest(request, RequestStatus.SUBMITTED, user, reason || 'Application submitted');

  const savedRequest = await requestRepository.save(request);
  const eventId = savedRequest.statusHistory.length - 1;

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_SUBMITTED,
    eventId
  });

  logger.info({ audit: true, eventType: 'APPLICATION_SUBMITTED', requestId: reqId, actorId: user.id, role: user.role, applicationNumber: savedRequest.requestNumber }, 'Application submitted');

  return savedRequest;
};

const withdrawRequest = async (requestId, user, reason, reqId) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  ensureRequestAccess(request, user);
  transitionRequest(request, RequestStatus.CANCELLED, user, reason || 'Application withdrawn');

  const savedRequest = await requestRepository.save(request);
  const eventId = savedRequest.statusHistory.length - 1;

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_CANCELLED,
    eventId
  });

  logger.info({ audit: true, eventType: 'APPLICATION_WITHDRAWN', requestId: reqId, actorId: user.id, role: user.role, applicationNumber: savedRequest.requestNumber }, 'Application withdrawn');

  return savedRequest;
};

const assignAgent = async (requestId, agentId, adminUser, reason, reqId) => {
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

  logger.info({ audit: true, eventType: 'APPLICATION_ASSIGNED', requestId: reqId, actorId: adminUser.id, targetAgentId: agentId, applicationNumber: savedRequest.requestNumber }, 'Application assigned to agent');

  return savedRequest;
};

const reassignAgent = async (requestId, agentId, adminUser, reason, reqId) => {
  const request = await requestRepository.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  }

  if (terminalStatuses?.includes(request.status)) {
     throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot reassign a terminal application');
  }

  await ensureAgentUser(agentId);

  const oldAgentId = request.assignedAgent;
  request.assignedAgent = agentId;
  request.assignedAt = new Date();

  appendStatusHistory(request, {
    fromStatus: request.status,
    toStatus: request.status,
    user: adminUser,
    reason: reason || 'Agent reassigned',
  });

  const savedRequest = await requestRepository.save(request);

  logger.info({ audit: true, eventType: 'APPLICATION_REASSIGNED', requestId: reqId, actorId: adminUser.id, targetAgentId: agentId, oldAgentId, applicationNumber: savedRequest.requestNumber }, 'Application reassigned to agent');

  return savedRequest;
};

const startProcessing = async (requestId, user, reqId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  ensureRequestAccess(request, user);

  transitionRequest(request, RequestStatus.IN_PROGRESS, user, 'Agent started processing');

  const savedRequest = await requestRepository.save(request);

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_IN_PROGRESS,
    eventId: savedRequest.statusHistory.length - 1
  });

  logger.info({ audit: true, eventType: 'APPLICATION_PROCESSING_STARTED', requestId: reqId, actorId: user.id, applicationNumber: savedRequest.requestNumber }, 'Application processing started');
  return savedRequest;
};

const requestCorrection = async (requestId, user, reason, reqId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  ensureRequestAccess(request, user);

  transitionRequest(request, RequestStatus.DOCUMENTS_REQUIRED, user, reason);

  const savedRequest = await requestRepository.save(request);

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.DOCUMENTS_REQUIRED,
    eventId: savedRequest.statusHistory.length - 1
  });

  logger.info({ audit: true, eventType: 'APPLICATION_CORRECTION_REQUESTED', requestId: reqId, actorId: user.id, applicationNumber: savedRequest.requestNumber }, 'Application correction requested');
  return savedRequest;
};

const approveRequest = async (requestId, user, reason, reqId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  ensureRequestAccess(request, user);

  transitionRequest(request, RequestStatus.COMPLETED, user, reason || 'Application approved');

  const savedRequest = await requestRepository.save(request);

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_COMPLETED,
    eventId: savedRequest.statusHistory.length - 1
  });

  logger.info({ audit: true, eventType: 'APPLICATION_APPROVED', requestId: reqId, actorId: user.id, applicationNumber: savedRequest.requestNumber }, 'Application approved');
  return savedRequest;
};

const rejectRequest = async (requestId, user, reason, reqId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  ensureRequestAccess(request, user);

  transitionRequest(request, RequestStatus.REJECTED, user, reason);

  const savedRequest = await requestRepository.save(request);

  await notificationService.createRequestNotification({
    recipientId: savedRequest.citizen,
    requestId: savedRequest._id,
    type: NotificationType.REQUEST_REJECTED,
    eventId: savedRequest.statusHistory.length - 1
  });

  logger.info({ audit: true, eventType: 'APPLICATION_REJECTED', requestId: reqId, actorId: user.id, applicationNumber: savedRequest.requestNumber }, 'Application rejected');
  return savedRequest;
};

const resubmitRequest = async (requestId, user, reason, reqId) => {
  const request = await requestRepository.findById(requestId);
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
  ensureRequestAccess(request, user);

  transitionRequest(request, RequestStatus.IN_PROGRESS, user, reason || 'Application resubmitted by citizen');

  const savedRequest = await requestRepository.save(request);

  logger.info({ audit: true, eventType: 'APPLICATION_RESUBMITTED', requestId: reqId, actorId: user.id, applicationNumber: savedRequest.requestNumber }, 'Application resubmitted');
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
  reassignAgent,
  withdrawRequest,
  createRequest,
  updateDraft,
  getRequestDetails,
  listRequests,
  submitRequest,
  resubmitRequest,
  startProcessing,
  requestCorrection,
  approveRequest,
  rejectRequest,
  getRequestsSummary,
  attachDocument,
};
