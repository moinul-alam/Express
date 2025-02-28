const { body, validationResult } = require('express-validator');
const { errorResponse } = require('@src/utils/responseFormatter');


//Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, errors.array());
  }
  next();
};

//Validation rules for registration
const registerValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').isEmail().withMessage('Email is required and must be valid'),
  body('password')
    .isLength({ min: 3 })
    .withMessage('Password must be at least 3 characters long'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of Birth is required')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Invalid Date of Birth format. Please use YYYY-MM-DD.')
    .custom((value) => {
      const dob = new Date(value);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 18) {
        throw new Error('You must be at least 18 years old.');
      }
      return true;
    }),
  handleValidationErrors,
];

//Validation rules for login
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
};
