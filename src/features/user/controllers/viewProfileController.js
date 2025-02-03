const User = require('@src/models/user');
const Media = require('@src/models/media');
const Review = require('@src/models/review');
const { errorResponse, successResponse } = require('@src/utils/responseFormatter');

const viewProfile = async (req, res, next) => {
  try {
    const userID = req.user?.id;
    if (!userID) return errorResponse(res, 'Unauthorized access. User ID is missing.', 401);

    // Fetch the user with populated preferences and reviews
    const user = await User.findById(userID)
      .select('-password')
      .populate([
        {
          path: 'preferences.favoriteMovies',
          model: Media,
          select: 'title tmdb_id media_type overview poster_path release_date vote_average',
        },
        {
          path: 'preferences.favoriteSeries',
          model: Media,
          select: 'title tmdb_id media_type overview poster_path release_date vote_average',
        },
        {
          path: 'preferences.watchlist',
          model: Media,
          select: 'title tmdb_id media_type overview poster_path release_date vote_average',
        },
        // Populating reviews using the Review model
        {
          path: 'reviews',
          model: Review,
          populate: [
            {
              path: 'mediaId',
              model: Media,
              select: 'title tmdb_id media_type overview poster_path release_date vote_average',
            },
            {
              path: 'userId',
              model: User,
              select: 'info.username',  // Retrieve only username or more fields as needed
            }
          ]
        },
      ]);

    if (!user) return errorResponse(res, 'User not found', 404);

    // Prepare the reviews data in the response
    const reviewsData = user.reviews.map(review => ({
      media: review.mediaId,
      rating: review.rating || null,
      comment: review.comment || '',
      reviewedAt: review.createdAt?.toLocaleDateString() || 'Unknown',
      username: review.userId?.info?.username || 'Anonymous', // Get username from the user reference
    }));

    // Construct the response data
    const responseData = {
      info: {
        username: user.info?.username || 'Guest',
        firstName: user.info?.firstName || '',
        lastName: user.info?.lastName || '',
        email: user.info?.email || 'Not provided',
        dateOfBirth: user.info?.dateOfBirth || 'Not specified',
        gender: user.info?.gender || 'Not specified',
        location: user.info?.location || 'Not specified',
        avatar: user.info?.avatar || '',
      },
      preferences: {
        language: user.preferences?.language || [],
        genres: user.preferences?.genres || [],
        favoriteMovies: user.preferences?.favoriteMovies || [],
        favoriteSeries: user.preferences?.favoriteSeries || [],
        watchlist: user.preferences?.watchlist || [],
      },
      reviews: reviewsData, // Include the formatted reviews
      createdAt: user.createdAt?.toLocaleDateString() || 'Unknown',
    };

    return successResponse(res, 'User profile retrieved successfully.', responseData);
  } catch (error) {
    next(error);
  }
};

module.exports = viewProfile;
