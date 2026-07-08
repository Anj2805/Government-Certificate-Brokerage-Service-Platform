const deliveryWorker = require('./delivery.worker');
const schedulerWorker = require('./scheduler.worker');

const startAll = () => {
  deliveryWorker.start();
  schedulerWorker.start();
};

const stopAll = () => {
  deliveryWorker.stop();
  schedulerWorker.stop();
};

module.exports = {
  startAll,
  stopAll,
  deliveryWorker,
  schedulerWorker,
};
