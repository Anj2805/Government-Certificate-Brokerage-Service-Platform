const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDatabase = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected');
    cached.conn = null;
    cached.promise = null;
  });

    cached.promise = mongoose.connect(config.database.uri, {
      maxPoolSize: config.database.maxPoolSize,
      autoIndex: !config.isProduction,
      serverSelectionTimeoutMS: 10000,
      family: 4,
      tlsAllowInvalidCertificates: true
    }).then((mongoose) => {
      return mongoose;
    }).catch(err => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDatabase;
