const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const AgentStatus = require('../../common/enums/agent-status.enum');
const RequestStatus = require('../../common/enums/request-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');
const Request = require('../requests/request.model');
const requestService = require('../requests/request.service');
const Service = require('../services/service.model');
const User = require('../users/user.model');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const buildPagination = (query) => ({
  page: query.page || DEFAULT_PAGE,
  limit: query.limit || DEFAULT_LIMIT,
});

const getDashboardMetrics = async () => {
  const [userMetrics, serviceMetrics, requestMetrics] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalCitizens: { $sum: { $cond: [{ $eq: ['$role', UserRoles.CITIZEN] }, 1, 0] } },
          totalAgents: { $sum: { $cond: [{ $eq: ['$role', UserRoles.AGENT] }, 1, 0] } },
          pendingAgentApprovals: { $sum: { $cond: [{ $and: [{ $eq: ['$role', UserRoles.AGENT] }, { $eq: ['$agentStatus', AgentStatus.PENDING] }] }, 1, 0] } },
          approvedAgents: { $sum: { $cond: [{ $and: [{ $eq: ['$role', UserRoles.AGENT] }, { $eq: ['$agentStatus', AgentStatus.APPROVED] }] }, 1, 0] } },
          rejectedAgents: { $sum: { $cond: [{ $and: [{ $eq: ['$role', UserRoles.AGENT] }, { $eq: ['$agentStatus', AgentStatus.REJECTED] }] }, 1, 0] } }
        },
      }
    ]),
    Service.aggregate([
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          activeServices: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          inactiveServices: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
        }
      }
    ]),
    Request.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          draftRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.DRAFT] }, 1, 0] } },
          submittedRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.SUBMITTED] }, 1, 0] } },
          assignedRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.ASSIGNED] }, 1, 0] } },
          inProgressRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.IN_PROGRESS] }, 1, 0] } },
          correctionRequiredRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.DOCUMENTS_REQUIRED] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.COMPLETED] }, 1, 0] } },
          rejectedRequests: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.REJECTED] }, 1, 0] } },
          pendingRequests: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [
                      RequestStatus.DRAFT,
                      RequestStatus.SUBMITTED,
                      RequestStatus.ASSIGNED,
                      RequestStatus.IN_PROGRESS,
                      RequestStatus.DOCUMENTS_REQUIRED,
                    ],
                  ],
                },
                1, 0
              ],
            },
          },
        },
      }
    ]),
  ]);

  const userM = userMetrics[0] || {};
  const serviceM = serviceMetrics[0] || {};
  const requestM = requestMetrics[0] || {};

  return {
    totalUsers: userM.totalUsers || 0,
    totalCitizens: userM.totalCitizens || 0,
    totalAgents: userM.totalAgents || 0,
    pendingAgentApprovals: userM.pendingAgentApprovals || 0,
    approvedAgents: userM.approvedAgents || 0,
    rejectedAgents: userM.rejectedAgents || 0,
    
    totalServices: serviceM.totalServices || 0,
    activeServices: serviceM.activeServices || 0,
    inactiveServices: serviceM.inactiveServices || 0,
    
    totalRequests: requestM.totalRequests || 0,
    draftRequests: requestM.draftRequests || 0,
    submittedRequests: requestM.submittedRequests || 0,
    assignedRequests: requestM.assignedRequests || 0,
    inProgressRequests: requestM.inProgressRequests || 0,
    correctionRequiredRequests: requestM.correctionRequiredRequests || 0,
    completedRequests: requestM.completedRequests || 0,
    rejectedRequests: requestM.rejectedRequests || 0,
    pendingRequests: requestM.pendingRequests || 0,
  };
};

const listAgents = async (query) => {
  const { page, limit } = buildPagination(query);
  const filter = { role: UserRoles.AGENT };

  if (query.status) {
    filter.agentStatus = query.status;
  }

  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [agents, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: agents,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const getAgent = async (agentId) => {
  const agent = await User.findOne({ _id: agentId, role: UserRoles.AGENT });

  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }

  return agent;
};

const getAgentDetails = async (agentId) => {
  const agent = await User.findOne({ _id: agentId, role: UserRoles.AGENT })
    .select('-password -__v')
    .lean();

  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }

  const assignedRequests = await Request.find({ assignedAgent: agentId })
    .select('status requestNumber createdAt updatedAt service')
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const metrics = await Request.aggregate([
    { $match: { assignedAgent: new mongoose.Types.ObjectId(agentId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return { ...agent, assignedRequests, metrics };
};

const approveAgent = async (agentId, adminUser) => {
  const agent = await getAgent(agentId);

  agent.agentStatus = AgentStatus.APPROVED;
  agent.isActive = true;
  agent.agentReviewedAt = new Date();
  agent.agentReviewedBy = adminUser.id;
  agent.agentRejectionReason = undefined;

  await agent.save();

  const notificationService = require('../notifications/notification.service');
  const NotificationType = require('../../common/enums/notification-type.enum');
  await notificationService.createNotification({
    recipientId: agent._id,
    type: NotificationType.AGENT_APPROVED,
    eventId: `${agent._id.toString()}:${agent.agentReviewedAt.getTime()}`,
  });

  return agent;
};

const rejectAgent = async (agentId, reason, adminUser) => {
  const agent = await getAgent(agentId);

  agent.agentStatus = AgentStatus.REJECTED;
  agent.isActive = false;
  agent.agentReviewedAt = new Date();
  agent.agentReviewedBy = adminUser.id;
  agent.agentRejectionReason = reason;

  return agent.save();
};

const suspendAgent = async (agentId, reason, adminUser) => {
  const agent = await getAgent(agentId);

  agent.agentStatus = AgentStatus.SUSPENDED;
  agent.isActive = false;
  agent.agentReviewedAt = new Date();
  agent.agentReviewedBy = adminUser.id;
  agent.agentRejectionReason = reason;

  return agent.save();
};

const listRequests = async (query, adminUser) =>
  requestService.listRequests({
    query,
    user: adminUser,
    scope: 'all',
  });

const getRequestDetails = async (requestId, adminUser) =>
  requestService.getRequestDetails(requestId, adminUser);

const getAnalytics = async (query = {}) => {
  const days = parseInt(query.days) || 30;
  const now = new Date();
  const startDate = new Date(now.setDate(now.getDate() - days));

  const [requestsByStatus, requestsOverTime, popularServices] = await Promise.all([
    Request.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Request.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]),
    Request.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'serviceDoc' } },
      { $unwind: '$serviceDoc' },
      { $project: { name: '$serviceDoc.name', count: 1 } }
    ])
  ]);

  return {
    requestsByStatus,
    requestsOverTime,
    popularServices
  };
};

const listUsers = async (query) => {
  const { page, limit } = buildPagination(query);
  const skip = (page - 1) * limit;

  const filter = { role: UserRoles.CITIZEN };
  if (query.search) {
    filter.$or = [
      { email: { $regex: query.search, $options: 'i' } },
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const getUserDetails = async (userId) => {
  const user = await User.findOne({ _id: userId, role: UserRoles.CITIZEN })
    .select('-password -__v')
    .lean();

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Citizen not found');
  }

  const requestHistory = await Request.find({ citizen: userId })
    .select('status requestNumber createdAt updatedAt service')
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return { ...user, requestHistory };
};

const globalSearch = async (searchTerm) => {
  if (!searchTerm) {
    return { users: [], agents: [], requests: [], services: [] };
  }

  const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(escapedSearch, 'i');

  const [users, agents, requests, services] = await Promise.all([
    User.find({
      role: UserRoles.CITIZEN,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    }).select('firstName lastName email').limit(5).lean(),
    User.find({
      role: UserRoles.AGENT,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    }).select('firstName lastName email agentStatus').limit(5).lean(),
    Request.find({
      requestNumber: searchRegex
    }).select('requestNumber status').limit(5).lean(),
    Service.find({
      name: searchRegex
    }).select('name category').limit(5).lean()
  ]);

  return {
    users,
    agents,
    requests,
    services
  };
};

const updateAgentBackground = async (agentId, background) => {
  const agent = await User.findOneAndUpdate(
    { _id: agentId, role: UserRoles.AGENT },
    { agentBackground: background },
    { new: true }
  ).select('-password -__v');

  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }
  
  return agent;
};

const updateAgentDepartment = async (agentId, department) => {
  const agent = await User.findOneAndUpdate(
    { _id: agentId, role: UserRoles.AGENT },
    { department },
    { new: true }
  ).select('-password -__v');

  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }
  
  return agent;
};

module.exports = {
  approveAgent,
  getDashboardMetrics,
  getAnalytics,
  globalSearch,
  getRequestDetails,
  getAgentDetails,
  listAgents,
  listRequests,
  rejectAgent,
  suspendAgent,
  listUsers,
  getUserDetails,
  updateAgentBackground,
  updateAgentDepartment,
};
