const { body, validationResult } = require('express-validator');

const validatePreferences = [
  // Validate language (ensure it's an array of strings)
  body('language')
    .optional()
    .isArray().withMessage('Language should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string'))
    .withMessage('Each language should be a string.'),

  // Validate genres (ensure it's an array of strings)
  body('genres')
    .optional()
    .isArray().withMessage('Genres should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string'))
    .withMessage('Each genre should be a string.'),

  // Validate favoriteMovies (ensure it's an array of strings or ObjectIds)
  body('favoriteMovies')
    .optional()
    .isArray().withMessage('Favorite Movies should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string' || /^[0-9a-fA-F]{24}$/.test(item)))
    .withMessage('Each favorite movie should be a valid ObjectId or a string.'),

  // Validate favoriteSeries (ensure it's an array of strings or ObjectIds)
  body('favoriteSeries')
    .optional()
    .isArray().withMessage('Favorite Series should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string' || /^[0-9a-fA-F]{24}$/.test(item)))
    .withMessage('Each favorite series should be a valid ObjectId or a string.'),

  // Validate favoriteActors (ensure it's an array of strings)
  body('favoriteActors')
    .optional()
    .isArray().withMessage('Favorite Actors should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string'))
    .withMessage('Each favorite actor should be a string.'),

  // Validate favoriteDirectors (ensure it's an array of strings)
  body('favoriteDirectors')
    .optional()
    .isArray().withMessage('Favorite Directors should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string'))
    .withMessage('Each favorite director should be a string.'),

  // Validate watchlist (ensure it's an array of strings or ObjectIds)
  body('watchlist')
    .optional()
    .isArray().withMessage('Watchlist should be an array.')
    .bail()
    .custom((value) => value.every((item) => typeof item === 'string' || /^[0-9a-fA-F]{24}$/.test(item)))
    .withMessage('Each watchlist item should be a valid ObjectId or a string.'),

  // Check if there are validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array(),
      });
    }
    next();
  }
];

module.exports = validatePreferences;
