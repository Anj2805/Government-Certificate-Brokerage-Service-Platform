const crypto = require('crypto');
const morgan = require('morgan');
const config = require('../config');
const logger = require('../config/logger');

morgan.token('id', (req) => req.id);

const assignRequestId = (req, res, next) => {
  const clientReqId = req.headers['x-request-id'];
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  req.id = (clientReqId && uuidRegex.test(clientReqId)) ? clientReqId : crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
};

const httpLogger = morgan(':id :method :url :status :res[content-length] - :response-time ms', {
  skip: () => config.env === 'test',
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

module.exports = [assignRequestId, httpLogger];
