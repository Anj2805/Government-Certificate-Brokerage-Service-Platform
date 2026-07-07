const express = require('express');
const config = require('./src/config');
const routes = require('./src/api/v1/routes');
const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');
const requestLogger = require('./src/middlewares/request-logger.middleware');
const securityMiddleware = require('./src/middlewares/security.middleware');
const swaggerMiddleware = require('./src/middlewares/swagger.middleware');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

securityMiddleware(app);

app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.urlencodedBodyLimit }));
app.use(securityMiddleware.afterBodyParser);
app.use(requestLogger);
app.use('/api-docs', swaggerMiddleware.serve, swaggerMiddleware.setup);

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: config.appName,
    version: config.api.version,
    basePath: config.api.basePath,
  });
});

app.use(config.api.basePath, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
