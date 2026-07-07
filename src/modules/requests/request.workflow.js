const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const RequestStatus = require('../../common/enums/request-status.enum');
const UserRoles = require('../../common/enums/user-roles.enum');

const terminalStatuses = Object.freeze([
  RequestStatus.COMPLETED,
  RequestStatus.REJECTED,
  RequestStatus.CANCELLED,
]);

const allowedTransitions = Object.freeze({
  [RequestStatus.DRAFT]: Object.freeze([
    RequestStatus.SUBMITTED,
    RequestStatus.CANCELLED,
  ]),
  [RequestStatus.SUBMITTED]: Object.freeze([
    RequestStatus.ASSIGNED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
  ]),
  [RequestStatus.ASSIGNED]: Object.freeze([
    RequestStatus.IN_PROGRESS,
    RequestStatus.DOCUMENTS_REQUIRED,
    RequestStatus.REJECTED,
  ]),
  [RequestStatus.IN_PROGRESS]: Object.freeze([
    RequestStatus.DOCUMENTS_REQUIRED,
    RequestStatus.COMPLETED,
    RequestStatus.REJECTED,
  ]),
  [RequestStatus.DOCUMENTS_REQUIRED]: Object.freeze([
    RequestStatus.IN_PROGRESS,
    RequestStatus.REJECTED,
  ]),
  [RequestStatus.COMPLETED]: Object.freeze([]),
  [RequestStatus.REJECTED]: Object.freeze([]),
  [RequestStatus.CANCELLED]: Object.freeze([]),
});

const roleTransitions = Object.freeze({
  [UserRoles.CITIZEN]: Object.freeze({
    [RequestStatus.DRAFT]: Object.freeze([
      RequestStatus.SUBMITTED,
      RequestStatus.CANCELLED,
    ]),
    [RequestStatus.SUBMITTED]: Object.freeze([
      RequestStatus.CANCELLED,
    ]),
  }),
  [UserRoles.AGENT]: Object.freeze({
    [RequestStatus.ASSIGNED]: Object.freeze([
      RequestStatus.IN_PROGRESS,
      RequestStatus.DOCUMENTS_REQUIRED,
    ]),
    [RequestStatus.IN_PROGRESS]: Object.freeze([
      RequestStatus.DOCUMENTS_REQUIRED,
      RequestStatus.COMPLETED,
    ]),
    [RequestStatus.DOCUMENTS_REQUIRED]: Object.freeze([
      RequestStatus.IN_PROGRESS,
    ]),
  }),
  [UserRoles.ADMIN]: allowedTransitions,
});

const assertTransitionAllowed = ({ fromStatus, toStatus, role }) => {
  if (fromStatus === toStatus) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Request is already in the requested status');
  }

  if (terminalStatuses.includes(fromStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot transition from terminal status: ${fromStatus}`);
  }

  const globallyAllowed = allowedTransitions[fromStatus] || [];

  if (!globallyAllowed.includes(toStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid request status transition: ${fromStatus} -> ${toStatus}`);
  }

  const allowedForRole = roleTransitions[role]?.[fromStatus] || [];

  if (!allowedForRole.includes(toStatus)) {
    throw new ApiError(httpStatus.FORBIDDEN, `Role ${role} cannot transition request from ${fromStatus} to ${toStatus}`);
  }
};

module.exports = {
  allowedTransitions,
  assertTransitionAllowed,
  roleTransitions,
  terminalStatuses,
};
