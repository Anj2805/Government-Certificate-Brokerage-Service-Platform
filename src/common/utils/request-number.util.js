const Counter = require('../models/counter.model');

const REQUEST_SEQUENCE_PREFIX = 'request';

const generateRequestNumber = async (date = new Date()) => {
  const year = date.getFullYear();
  const key = `${REQUEST_SEQUENCE_PREFIX}:${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return `REQ-${year}-${String(counter.sequence).padStart(6, '0')}`;
};

module.exports = {
  generateRequestNumber,
};
