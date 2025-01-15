const viewProfile = require('@src/features/user/controllers/viewProfileController');

const updateProfile = require('@src/features/user/controllers/updateProfileController');

const deleteProfile = require('@src/features/user/controllers/deleteProfileController');

const updatePreferences = require('@src/features/user/controllers/updatePreferencesController');

const updateReviews = require('@src/features/user/controllers/updateReviewsController');


module.exports = {
  viewProfile, 
  updateProfile, 
  deleteProfile,
  updatePreferences, 
  updateReviews
}
