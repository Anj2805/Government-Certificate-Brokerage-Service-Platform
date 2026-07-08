const workers = require('./src/workers');
const connectDatabase = require('./src/config/database');
const logger = require('./src/config/logger');

const startWorker = async () => {
  try {
    await connectDatabase();
    workers.startAll();
    logger.info('Background workers initialized successfully');
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start workers');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutdown signal received');
  workers.stopAll();

  // Allow bounded completion
  const config = require('./src/config');
  setTimeout(async () => {
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close(false);
      logger.info('Workers and MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during worker shutdown');
      process.exit(1);
    }
  }, config.worker.shutdownTimeoutMs);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection in worker');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception in worker');
  process.exit(1);
});

startWorker();
