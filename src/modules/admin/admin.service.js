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
          totalAgents: {
            $sum: {
              $cond: [{ $eq: ['$role', UserRoles.AGENT] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          totalAgents: 1,
        },
      },
    ]),
    Service.countDocuments({ deletedAt: null }),
    Request.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          completedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', RequestStatus.COMPLETED] }, 1, 0],
            },
          },
          rejectedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', RequestStatus.REJECTED] }, 1, 0],
            },
          },
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
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRequests: 1,
          completedRequests: 1,
          rejectedRequests: 1,
          pendingRequests: 1,
        },
      },
    ]),
  ]);

  return {
    totalUsers: userMetrics[0]?.totalUsers || 0,
    totalAgents: userMetrics[0]?.totalAgents || 0,
    totalServices: serviceMetrics || 0,
    totalRequests: requestMetrics[0]?.totalRequests || 0,
    completedRequests: requestMetrics[0]?.completedRequests || 0,
    rejectedRequests: requestMetrics[0]?.rejectedRequests || 0,
    pendingRequests: requestMetrics[0]?.pendingRequests || 0,
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

const approveAgent = async (agentId, adminUser) => {
  const agent = await getAgent(agentId);

  agent.agentStatus = AgentStatus.APPROVED;
  agent.isActive = true;
  agent.agentReviewedAt = new Date();
  agent.agentReviewedBy = adminUser.id;
  agent.agentRejectionReason = undefined;

  return agent.save();
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

module.exports = {
  approveAgent,
  getDashboardMetrics,
  getRequestDetails,
  listAgents,
  listRequests,
  rejectAgent,
  suspendAgent,
};
