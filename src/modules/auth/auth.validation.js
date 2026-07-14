const { body } = require('express-validator');
const UserRoles = require('../../common/enums/user-roles.enum');

const passwordRuleFor = (field) => body(field)
  .isString()
  .isLength({ min: 8, max: 128 })
  .withMessage(`${field} must be between 8 and 128 characters`)
  .matches(/[a-z]/)
  .withMessage(`${field} must contain at least one lowercase letter`)
  .matches(/[A-Z]/)
  .withMessage(`${field} must contain at least one uppercase letter`)
  .matches(/\d/)
  .withMessage(`${field} must contain at least one number`);

const passwordRule = passwordRuleFor('password');

const register = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('firstName must be between 2 and 80 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('lastName must be between 2 and 80 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('email must be valid'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('phone must be valid'),
  body('role')
    .optional()
    .isIn([UserRoles.CITIZEN, UserRoles.AGENT])
    .withMessage('public registration is only allowed for citizen or agent accounts'),
  body('address')
    .if(body('role').equals(UserRoles.CITIZEN))
    .trim()
    .notEmpty()
    .withMessage('Address is required for citizens')
    .isLength({ max: 255 })
    .withMessage('Address cannot exceed 255 characters'),
  body('city')
    .if(body('role').equals(UserRoles.CITIZEN))
    .trim()
    .notEmpty()
    .withMessage('City is required for citizens')
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('state')
    .if(body('role').equals(UserRoles.CITIZEN))
    .trim()
    .notEmpty()
    .withMessage('State is required for citizens')
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  body('postalCode')
    .if(body('role').equals(UserRoles.CITIZEN))
    .trim()
    .notEmpty()
    .withMessage('Postal code is required for citizens')
    .isLength({ max: 20 })
    .withMessage('Postal code cannot exceed 20 characters'),
  passwordRule,
];

const login = [
  body('email').trim().isEmail().normalizeEmail().withMessage('email must be valid'),
  body('password').notEmpty().withMessage('password is required'),
  body('role')
    .optional()
    .isIn([UserRoles.CITIZEN, UserRoles.AGENT, UserRoles.ADMIN])
    .withMessage('role must be valid'),
];

const refreshToken = [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'),
];

const forgotPassword = [
  body('email').trim().isEmail().normalizeEmail().withMessage('email must be valid'),
];

const changePassword = [
  body('currentPassword').isString().notEmpty().withMessage('currentPassword is required'),
  passwordRuleFor('newPassword'),
  body('confirmPassword')
    .isString()
    .notEmpty()
    .withMessage('confirmPassword is required')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.newPassword) {
        throw new Error('confirmPassword must match newPassword');
      }
      return true;
    }),
];

const resetPassword = [
  body('token')
    .isString()
    .trim()
    .isLength({ min: 32, max: 256 })
    .withMessage('token is invalid'),
  passwordRuleFor('newPassword'),
  body('confirmPassword')
    .isString()
    .notEmpty()
    .withMessage('confirmPassword is required')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.newPassword) {
        throw new Error('confirmPassword must match newPassword');
      }
      return true;
    }),
];

const verifyEmail = [
  body('token')
    .isString()
    .trim()
    .isLength({ min: 32, max: 256 })
    .withMessage('token is invalid'),
];

const resendVerification = [
  body('email').trim().isEmail().normalizeEmail().withMessage('email must be valid'),
];

module.exports = {
  changePassword,
  forgotPassword,
  register,
  login,
  refreshToken,
  resetPassword,
  verifyEmail,
  resendVerification,
};
