const Service = require('./service.model');

const buildServiceQuery = ({ search, category, includeInactive = false, includeDeleted = false } = {}) => {
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

const findPaginated = async ({ page, limit, search, category, includeInactive, includeDeleted }) => {
  const query = buildServiceQuery({ search, category, includeInactive, includeDeleted });
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
