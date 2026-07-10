const http = require('http');
const app = require('./app');
const config = require('./src/config');
const connectDatabase = require('./src/config/database');
const logger = require('./src/config/logger');
const workers = require('./src/workers');

let server;

const startServer = async () => {
  try {
    await connectDatabase();

    if (config.env === 'development') {
      workers.startAll();
      logger.info('Background workers started in development mode');

      if (config.email.isSmtpConfigured && /@resend\.dev>/i.test(config.email.from)) {
        logger.warn(
          'EMAIL_FROM uses resend.dev — Resend only delivers test emails to the address on your Resend account. Verify a domain and update EMAIL_FROM to send to any recipient.',
        );
      }
    }

    server = http.createServer(app);
    server.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
          apiBasePath: config.api.basePath,
          emailDelivery: config.email.isSmtpConfigured ? 'smtp' : 'json-transport',
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

  workers.stopAll();

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
