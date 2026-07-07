const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: 'Government Certificate API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerSpec, swaggerUiOptions),
};
