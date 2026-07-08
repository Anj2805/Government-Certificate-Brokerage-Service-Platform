const mongoose = require('mongoose');
const Request = require('./request.model');

const create = (payload) => Request.create(payload);

const findById = (id) => Request.findById(id);

const findPaginated = async ({ query, page, limit }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Request.find(query)
      .populate('service', 'name category')
      .populate('citizen', 'firstName lastName email role')
      .populate('assignedAgent', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Request.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const httpStatus = require('http-status');
const ApiError = require('../../common/errors/api-error');

const save = async (request) => {
  try {
    return await request.save();
  } catch (error) {
    if (error instanceof mongoose.Error.VersionError) {
      throw new ApiError(httpStatus.CONFLICT, 'Concurrent update detected. Please try again.');
    }
    throw error;
  }
};

const getSummary = async (citizenId) => {
  const result = await Request.aggregate([
    { $match: { citizen: new mongoose.Types.ObjectId(citizenId) } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        activeRequests: {
          $sum: {
            $cond: [
              { $in: ['$status', ['submitted', 'assigned', 'in_progress', 'documents_required']] },
              1,
              0
            ]
          }
        },
        completedRequests: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              1,
              0
            ]
          }
        },
        documentsRequiredRequests: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'documents_required'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  if (!result.length) {
    return {
      totalRequests: 0,
      activeRequests: 0,
      completedRequests: 0,
      documentsRequiredRequests: 0,
    };
  }

  return {
    totalRequests: result[0].totalRequests,
    activeRequests: result[0].activeRequests,
    completedRequests: result[0].completedRequests,
    documentsRequiredRequests: result[0].documentsRequiredRequests,
  };
};

module.exports = {
  create,
  findById,
  findPaginated,
  save,
  getSummary,
};
