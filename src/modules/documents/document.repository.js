const Document = require('./document.model');

const create = (payload) => Document.create(payload);

const findById = (id, { includeDeleted = false } = {}) => {
  const query = { _id: id };

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  return Document.findOne(query);
};

const findPaginated = async ({ query, page, limit }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Document.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

const save = (document) => document.save();

module.exports = {
  create,
  findById,
  findPaginated,
  save,
};
