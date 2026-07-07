const { Router } = require('express');
const Permissions = require('../../common/enums/permissions.enum');
const authenticate = require('../../middlewares/auth.middleware');
const optionalAuthenticate = require('../../middlewares/optional-auth.middleware');
const { authorizePermission } = require('../../middlewares/role.middleware');
const validateRequest = require('../../middlewares/validate-request.middleware');
const serviceController = require('./service.controller');
const serviceValidation = require('./service.validation');

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validateRequest(serviceValidation.listServices),
  serviceController.listServices,
);

router.get(
  '/:id',
  optionalAuthenticate,
  validateRequest(serviceValidation.getService),
  serviceController.getServiceDetails,
);

router.post(
  '/',
  authenticate,
  authorizePermission(Permissions.SERVICE_CREATE),
  validateRequest(serviceValidation.createService),
  serviceController.createService,
);

router.patch(
  '/:id',
  authenticate,
  authorizePermission(Permissions.SERVICE_UPDATE),
  validateRequest(serviceValidation.updateService),
  serviceController.updateService,
);

router.patch(
  '/:id/status',
  authenticate,
  authorizePermission(Permissions.SERVICE_UPDATE),
  validateRequest(serviceValidation.setActiveStatus),
  serviceController.setActiveStatus,
);

router.delete(
  '/:id',
  authenticate,
  authorizePermission(Permissions.SERVICE_DELETE),
  validateRequest(serviceValidation.deleteService),
  serviceController.deleteService,
);

module.exports = router;
