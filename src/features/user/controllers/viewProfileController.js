const User = require('@src/models/user');
const Media = require('@src/models/media');
const { errorResponse, successResponse } = require('@src/utils/responseFormatter');

const viewProfile = async (req, res, next) => {
    try {
      const userID = req.user?.id;
      if (!userID) return errorResponse(res, 'Unauthorized access. User ID is missing.', 401);
  
      const user = await User.findById(userID)
        .select('-password')
        .populate([
          {
            path: 'preferences.favoriteMovies',
            model: Media,
            select: 'title tmdb_id media_type overview poster_path release_date vote_average',  // Added vote_average here
          },
          {
            path: 'preferences.favoriteSeries',
            model: Media,
            select: 'title tmdb_id media_type overview poster_path release_date vote_average',  // Added vote_average here
          },
          {
            path: 'preferences.watchlist',
            model: Media,
            select: 'title tmdb_id media_type overview poster_path release_date vote_average',  // Added vote_average here
          },
          {
            path: 'reviews.mediaID',
            model: Media,
            select: 'title tmdb_id media_type overview poster_path release_date vote_average',  // Added vote_average here
          },
        ]);
  
      if (!user) return errorResponse(res, 'User not found', 404);
  
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
        reviews: user.reviews.map(review => ({
          media: review.mediaID,
          rating: review.rating || null,
          comment: review.comment || '',
          reviewedAt: review.reviewedAt?.toLocaleDateString() || 'Unknown',
        })),
        createdAt: user.createdAt?.toLocaleDateString() || 'Unknown',
      };
  
      return successResponse(res, 'User profile retrieved successfully.', responseData);
    } catch (error) {
      next(error);
    }
};

module.exports = viewProfile;
