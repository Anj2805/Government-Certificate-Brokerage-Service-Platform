const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');
const UserRoles = require('../../common/enums/user-roles.enum');
const serviceRepository = require('./service.repository');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const normalizeServicePayload = (payload) => ({
  ...payload,
  name: payload.name?.trim(),
  category: payload.category?.trim().toLowerCase(),
  requiredDocuments: payload.requiredDocuments?.map((document) => document.trim()),
  estimatedProcessingDays: payload.estimatedProcessingDays || payload.estimatedTime,
  estimatedTime: undefined,
});

const ensureUniqueNameInCategory = async ({ name, category, currentServiceId = null }) => {
  if (!name || !category) {
    return;
  }

  const existingService = await serviceRepository.findByNameAndCategory(name, category);

  if (existingService && existingService.id !== currentServiceId) {
    throw new ApiError(httpStatus.CONFLICT, 'A service with this name already exists in this category');
  }
};

const createService = async (payload, adminUserId) => {
  const normalizedPayload = normalizeServicePayload(payload);

  await ensureUniqueNameInCategory({
    name: normalizedPayload.name,
    category: normalizedPayload.category,
  });

  return serviceRepository.create({
    ...normalizedPayload,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
};

const updateService = async (serviceId, payload, adminUserId) => {
  const service = await serviceRepository.findById(serviceId);

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }

  const normalizedPayload = normalizeServicePayload(payload);
  const nextName = normalizedPayload.name || service.name;
  const nextCategory = normalizedPayload.category || service.category;

  await ensureUniqueNameInCategory({
    name: nextName,
    category: nextCategory,
    currentServiceId: service.id,
  });

  Object.assign(service, normalizedPayload, { updatedBy: adminUserId });

  return serviceRepository.save(service);
};

const softDeleteService = async (serviceId, adminUserId) => {
  const service = await serviceRepository.findById(serviceId);

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }

  service.isActive = false;
  service.deletedAt = new Date();
  service.deletedBy = adminUserId;
  service.updatedBy = adminUserId;

  return serviceRepository.save(service);
};

const setActiveStatus = async (serviceId, isActive, adminUserId) => {
  const service = await serviceRepository.findById(serviceId);

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }

  service.isActive = isActive;
  service.updatedBy = adminUserId;

  return serviceRepository.save(service);
};

const listServices = async (query, user = null) => {
  const page = query.page || DEFAULT_PAGE;
  const limit = query.limit || DEFAULT_LIMIT;
  const isAdmin = user?.role === UserRoles.ADMIN;

  return serviceRepository.findPaginated({
    page,
    limit,
    search: query.search,
    category: query.category,
    includeInactive: isAdmin && query.includeInactive === true,
    includeDeleted: isAdmin && query.includeDeleted === true,
  });
};

const getServiceDetails = async (serviceId, user = null) => {
  const isAdmin = user?.role === UserRoles.ADMIN;
  const service = await serviceRepository.findById(serviceId, { includeDeleted: isAdmin });

  if (!service || (!isAdmin && !service.isActive)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }

  return service;
};

module.exports = {
  createService,
  getServiceDetails,
  listServices,
  setActiveStatus,
  softDeleteService,
  updateService,
};
