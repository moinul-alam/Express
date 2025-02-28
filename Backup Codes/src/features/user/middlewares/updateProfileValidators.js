const { body, validationResult } = require('express-validator');

// Validation rules for updating preferences
const validateProfile = [
    // Optional fields, validation rules for each field
    body('firstName')
        .optional()
        .isString()
        .withMessage('First name must be a string'),

    body('lastName')
        .optional()
        .isString()
        .withMessage('Last name must be a string'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Email must be valid')
        .normalizeEmail(),

    body('dateOfBirth')
        .optional()
        .isDate()
        .withMessage('Date of Birth must be a valid date'),

    body('location')
        .optional()
        .isString()
        .withMessage('Location must be a string'),

    body('gender')
        .optional()
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be one of the following: Male, Female, Other'),

    body('avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL'),

    // Middleware to handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array(),
            });
        }
        next();
    },
];

module.exports = validateProfile;
