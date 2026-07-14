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
    RequestStatus.UNDER_REVIEW,
    RequestStatus.CORRECTION_REQUIRED,
    RequestStatus.REJECTED,
  ]),
  [RequestStatus.UNDER_REVIEW]: Object.freeze([
    RequestStatus.CORRECTION_REQUIRED,
    RequestStatus.APPROVED,
    RequestStatus.COMPLETED,
    RequestStatus.REJECTED,
  ]),
  [RequestStatus.CORRECTION_REQUIRED]: Object.freeze([
    RequestStatus.UNDER_REVIEW,
    RequestStatus.REJECTED,
  ]),
  [RequestStatus.APPROVED]: Object.freeze([
    RequestStatus.COMPLETED,
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
    [RequestStatus.CORRECTION_REQUIRED]: Object.freeze([
      RequestStatus.UNDER_REVIEW,
      RequestStatus.RESUBMITTED,
    ]),
  }),
  [UserRoles.AGENT]: Object.freeze({
    [RequestStatus.ASSIGNED]: Object.freeze([
      RequestStatus.UNDER_REVIEW,
      RequestStatus.CORRECTION_REQUIRED,
      RequestStatus.REJECTED,
    ]),
    [RequestStatus.UNDER_REVIEW]: Object.freeze([
      RequestStatus.CORRECTION_REQUIRED,
      RequestStatus.APPROVED,
      RequestStatus.COMPLETED,
      RequestStatus.REJECTED,
    ]),
    [RequestStatus.CORRECTION_REQUIRED]: Object.freeze([
      RequestStatus.UNDER_REVIEW,
      RequestStatus.REJECTED,
    ]),
    [RequestStatus.APPROVED]: Object.freeze([
      RequestStatus.COMPLETED,
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
