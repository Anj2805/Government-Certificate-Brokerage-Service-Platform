const http = require('http');
const app = require('./app');
const config = require('./src/config');
const connectDatabase = require('./src/config/database');
const logger = require('./src/config/logger');

let server;

const startServer = async () => {
  try {
    await connectDatabase();

    server = http.createServer(app);
    server.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
          apiBasePath: config.api.basePath,
        },
        'HTTP server started',
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutdown signal received');

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close(false);
      logger.info('HTTP server and MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

startServer();
