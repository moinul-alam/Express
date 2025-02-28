const User = require('@src/models/user');
const Media = require('@src/models/media');
const Person = require('@src/models/person');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { add, remove } = req.body;

    if (!add && !remove) {
      return errorResponse(res, 'No preferences provided to update.', 400);
    }

    const updateOperations = {};

    // Handle 'add' preferences
    if (add) {
      for (const [key, values] of Object.entries(add)) {
        if (Array.isArray(values) && values.length > 0) {
          updateOperations.$addToSet = updateOperations.$addToSet || {};

          // Validate ObjectIds for actors, directors, and media references
          if (['favoriteActors', 'favoriteDirectors'].includes(key)) {
            const validIds = await validatePersonIds(values);
            updateOperations.$addToSet[`preferences.${key}`] = { $each: validIds };
          } else if (['favoriteMovies', 'favoriteSeries', 'watchlist'].includes(key)) {
            const validIds = await validateMediaIds(values);
            updateOperations.$addToSet[`preferences.${key}`] = { $each: validIds };
          } else {
            updateOperations.$addToSet[`preferences.${key}`] = { $each: values };
          }
        }
      }
    }

    // Handle 'remove' preferences
    if (remove) {
      for (const [key, values] of Object.entries(remove)) {
        if (Array.isArray(values) && values.length > 0) {
          updateOperations.$pullAll = updateOperations.$pullAll || {};

          // Validate ObjectIds for actors, directors, and media references
          if (['favoriteActors', 'favoriteDirectors'].includes(key)) {
            const validIds = await validatePersonIds(values);
            updateOperations.$pullAll[`preferences.${key}`] = validIds;
          } else if (['favoriteMovies', 'favoriteSeries', 'watchlist'].includes(key)) {
            const validIds = await validateMediaIds(values);
            updateOperations.$pullAll[`preferences.${key}`] = validIds;
          } else {
            updateOperations.$pullAll[`preferences.${key}`] = values;
          }
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateOperations,
      { 
        new: true, 
        runValidators: true,
      }
    )
      .populate('preferences.favoriteMovies preferences.favoriteSeries preferences.watchlist')
      .populate('preferences.favoriteActors preferences.favoriteDirectors'); // Populate actor/director references

    if (!updatedUser) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, 'Preferences updated successfully.', updatedUser.preferences);

  } catch (error) {
    console.error('Error updating preferences:', error);
    next(error);
  }
};

// Helper to validate Person IDs
const validatePersonIds = async (ids) => {
  const validPersons = await Person.find({ _id: { $in: ids } }, '_id').lean();
  return validPersons.map((person) => person._id.toString());
};

// Helper to validate Media IDs
const validateMediaIds = async (ids) => {
  const validMedia = await Media.find({ _id: { $in: ids } }, '_id').lean();
  return validMedia.map((media) => media._id.toString());
};

module.exports = updatePreferences;
