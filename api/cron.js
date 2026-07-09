const connectDatabase = require('../src/config/database');
const { deliveryWorker, schedulerWorker } = require('../src/workers');
const logger = require('../src/config/logger');

module.exports = async (req, res) => {
  // Enforce CRON_SECRET authorization
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron invocation attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDatabase();
    
    // Run bounded work
    await Promise.all([
      deliveryWorker.runOnce(),
      schedulerWorker.runOnce(),
    ]);
    
    logger.info('Cron jobs executed successfully');
    return res.status(200).json({ success: true, message: 'Cron processed successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Error executing cron jobs');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
