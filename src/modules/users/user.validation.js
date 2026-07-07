const { body } = require('express-validator');

const ALLOWED_PROFILE_FIELDS = ['firstName', 'lastName', 'phone'];

const rejectUnknownProfileFields = body().custom((value) => {
  const fields = Object.keys(value || {});
  const invalidFields = fields.filter((field) => !ALLOWED_PROFILE_FIELDS.includes(field));

  if (invalidFields.length > 0) {
    throw new Error(`Unsupported profile field(s): ${invalidFields.join(', ')}`);
  }

  if (fields.length === 0) {
    throw new Error('At least one profile field is required');
  }

  return true;
});

const updateMyProfile = [
  rejectUnknownProfileFields,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('firstName must be between 2 and 80 characters')
    .matches(/^[A-Za-z][A-Za-z\s'.-]*$/)
    .withMessage('firstName contains unsupported characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('lastName must be between 2 and 80 characters')
    .matches(/^[A-Za-z][A-Za-z\s'.-]*$/)
    .withMessage('lastName contains unsupported characters'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('phone must be valid'),
];

module.exports = {
  updateMyProfile,
};
