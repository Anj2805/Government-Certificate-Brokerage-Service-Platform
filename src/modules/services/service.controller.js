const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const serviceService = require('./service.service');

const createService = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body, req.user.id);

  return ApiResponse.success(res, {
    statusCode: httpStatus.CREATED,
    message: 'Service created successfully',
    data: { service },
  });
});

const updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body, req.user.id);

  return ApiResponse.success(res, {
    message: 'Service updated successfully',
    data: { service },
  });
});

const deleteService = asyncHandler(async (req, res) => {
  const service = await serviceService.softDeleteService(req.params.id, req.user.id);

  return ApiResponse.success(res, {
    message: 'Service deleted successfully',
    data: { service },
  });
});

const setActiveStatus = asyncHandler(async (req, res) => {
  const service = await serviceService.setActiveStatus(req.params.id, req.body.isActive, req.user.id);

  return ApiResponse.success(res, {
    message: req.body.isActive ? 'Service activated successfully' : 'Service deactivated successfully',
    data: { service },
  });
});

const listServices = asyncHandler(async (req, res) => {
  const result = await serviceService.listServices(req.query, req.user);

  return ApiResponse.success(res, {
    message: 'Services fetched successfully',
    data: { services: result.items },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const getServiceDetails = asyncHandler(async (req, res) => {
  const service = await serviceService.getServiceDetails(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Service details fetched successfully',
    data: { service },
  });
});

module.exports = {
  createService,
  deleteService,
  getServiceDetails,
  listServices,
  setActiveStatus,
  updateService,
};
