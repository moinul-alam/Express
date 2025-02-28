const express = require('express');
const {
  viewProfile, updateProfile, deleteProfile, updatePreferences, updateReviews, deleteReviews
} = require('@src/features/user/controllers');
const validateProfile = require('@src/features/user/middlewares/updateProfileValidators');
const validatePreferences = require('@src/features/user/middlewares/updatePreferencesValidators');

const verifyToken = require ('@src/middlewares/verifyToken');

const router = express.Router();

// Profile view, update and delete routes
router.get('/profile/view', verifyToken, viewProfile);

router.patch('/profile/update', verifyToken, validateProfile, updateProfile); 

router.delete('/profile/delete', verifyToken, deleteProfile);

// Preferences and review route
router.patch('/preferences/update', verifyToken, validatePreferences, updatePreferences);

router.patch('/reviews/update', verifyToken, updateReviews);



module.exports = router;
