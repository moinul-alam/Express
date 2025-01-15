const User = require('@src/models/user');
const Media = require('@src/models/media');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const updateReview = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { add, remove } = req.body;

    if (!add && !remove) return errorResponse(res, 'No review operations provided.', 400);

    const updateOperations = {};

    if (add) {
      if (!Array.isArray(add)) return errorResponse(res, 'Add reviews must be an array.', 400);

      const validReviews = add.filter(review => 
        review.mediaType && 
        review.mediaID && 
        review.rating !== undefined && 
        review.rating >= 1 && 
        review.rating <= 10
      );

      if (validReviews.length > 0) {
        updateOperations.$push = { reviews: { $each: validReviews } };
      }
    }

    if (remove) {
      if (!Array.isArray(remove)) return errorResponse(res, 'Remove reviews must be an array of review IDs.', 400);

      updateOperations.$pull = { reviews: { _id: { $in: remove } } };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateOperations,
      { new: true, runValidators: true }
    ).populate({ path: 'reviews.mediaID', model: Media });

    if (!updatedUser) return errorResponse(res, 'User not found.', 404);

    const responseReviews = updatedUser.reviews.map(review => ({
      _id: review._id,
      mediaType: review.mediaType,
      mediaID: review.mediaID,
      rating: review.rating,
      comment: review.comment,
      reviewedAt: review.reviewedAt,
    }));

    return successResponse(res, 'Reviews updated successfully.', responseReviews);
  } catch (error) {
    console.error('Error updating reviews:', error);
    next(error);
  }
};

module.exports = updateReview;
