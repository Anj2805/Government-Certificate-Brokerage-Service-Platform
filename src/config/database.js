const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected');
  });

  return mongoose.connect(config.database.uri, {
    maxPoolSize: config.database.maxPoolSize,
    autoIndex: !config.isProduction,
    serverSelectionTimeoutMS: 10000,
    family: 4,
    tlsAllowInvalidCertificates: true
  });
};

module.exports = connectDatabase;
