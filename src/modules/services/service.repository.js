const Service = require('./service.model');

const buildServiceQuery = ({ search, category, includeInactive = false, includeDeleted = false, maxFee, timeFilters } = {}) => {
  const query = {};

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  if (!includeInactive) {
    query.isActive = true;
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (maxFee !== undefined && maxFee !== null) {
    query.serviceCharge = { $lte: Number(maxFee) };
  }

  if (timeFilters && timeFilters.length > 0) {
    const timeOrQuery = timeFilters.map(filter => {
      if (filter === '7d') return { estimatedProcessingDays: { $lte: 7 } };
      if (filter === '1-2w') return { estimatedProcessingDays: { $gt: 7, $lte: 14 } };
      if (filter === '2-4w') return { estimatedProcessingDays: { $gt: 14, $lte: 30 } };
      if (filter === '1m+') return { estimatedProcessingDays: { $gt: 30 } };
      return null;
    }).filter(Boolean);

    if (timeOrQuery.length > 0) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: timeOrQuery }];
        delete query.$or;
      } else {
        query.$or = timeOrQuery;
      }
    }
  }

  return query;
};

const create = (payload) => Service.create(payload);

const findById = (id, { includeDeleted = false } = {}) => {
  const query = { _id: id };

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  return Service.findOne(query);
};

const findByNameAndCategory = (name, category) =>
  Service.findOne({
    name,
    category,
    deletedAt: null,
  });

const findPaginated = async ({ page, limit, search, category, includeInactive, includeDeleted, maxFee, timeFilters }) => {
  const query = buildServiceQuery({ search, category, includeInactive, includeDeleted, maxFee, timeFilters });
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Service.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Service.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const save = (service) => service.save();

module.exports = {
  create,
  findById,
  findByNameAndCategory,
  findPaginated,
  save,
};
