const mongoose = require('mongoose');
const User = require('@src/models/user');
const Media = require('@src/models/media');
const Review = require('@src/models/review');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const updateReview = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { add, remove } = req.body;

    if (!add && !remove) {
      return errorResponse(res, 'No review operations provided.', 400);
    }

    let addedReviews = [];
    let removedReviews = [];

    // Handle adding reviews
    if (add) {
      if (!Array.isArray(add)) {
        return errorResponse(res, 'Add reviews must be an array.', 400);
      }

      for (const review of add) {
        const { mediaType: media_type, tmdb_id, mediaId, rating, comment } = review;

        if (!tmdb_id || rating === undefined || rating < 1 || rating > 10) {
          console.log(`Skipping invalid review: ${JSON.stringify(review)}`);
          continue;
        }

        const media = await Media.findOne({ media_type, tmdb_id });
        if (!media) {
          return errorResponse(res, `${media_type} with tmdb_id ${tmdb_id} not found.`, 404);
        }

        // Check if user already reviewed this movie
        const existingReview = await Review.findOne({ media_type, tmdb_id, userId });

        if (existingReview) {
          // Update existing review
          const oldRating = existingReview.rating;
          existingReview.rating = rating;
          existingReview.comment = comment;
          await existingReview.save();
          console.log(`Updated existing review: ${JSON.stringify(existingReview)}`);

          // Update media's vote_average
          const ratingSum = media.vote_average * media.vote_count;
          const newRatingSum = ratingSum - oldRating + rating;
          const newVoteCount = media.vote_count;
          const newVoteAverage = newRatingSum / newVoteCount;
          await Media.updateOne({ tmdb_id }, { vote_average: newVoteAverage });

          addedReviews.push(existingReview);
        } else {
          // Create new review
          const newReview = new Review({
            media_type,
            tmdb_id,
            mediaId: new mongoose.Types.ObjectId(mediaId),
            userId,
            rating,
            comment
            
          });
          await newReview.save();
          console.log(`Saved new review: ${JSON.stringify(newReview)}`);

          // Update media's vote_average
          const ratingSum = media.vote_average * media.vote_count;
          const newRatingSum = ratingSum + rating;
          const newVoteCount = media.vote_count + 1;
          const newVoteAverage = newRatingSum / newVoteCount;
          await Media.updateOne({ tmdb_id }, {
            $push: { reviews: newReview._id },
            vote_average: newVoteAverage,
            vote_count: newVoteCount,
          });

          // Also update user's reviews
          await User.updateOne({ _id: userId }, { $push: { reviews: newReview._id } });

          addedReviews.push(newReview);
        }
      }
    }

    // Handle removing reviews
    if (remove) {
      if (!Array.isArray(remove)) {
        return errorResponse(res, 'Remove reviews must be an array of tmdb_id.', 400);
      }

      for (const tmdb_id of remove) {
        const media = await Media.findOne({ mediaType, tmdb_id });
        if (!media) {
          return errorResponse(res, `${mediaType} with tmdb_id ${tmdb_id} not found.`, 404);
        }

        const deletedReview = await Review.findOneAndDelete({ mediaType, tmdb_id, userId });
        if (deletedReview) {
          console.log(`Deleted review: ${JSON.stringify(deletedReview)}`);

          // Remove the review from the media and user
          await Media.updateOne({ mediaType, tmdb_id }, { $pull: { reviews: deletedReview._id } });
          await User.updateOne({ _id: userId }, { $pull: { reviews: deletedReview._id } });
          removedReviews.push(deletedReview);

          // Update media's vote_average after review removal
          const ratingSum = media.vote_average * media.vote_count;
          const newRatingSum = ratingSum - deletedReview.rating;
          const newVoteCount = media.vote_count - 1;
          const newVoteAverage = newVoteCount > 0 ? newRatingSum / newVoteCount : 0; // Avoid division by zero
          await Media.updateOne({ tmdb_id }, { vote_average: newVoteAverage, vote_count: newVoteCount });
        }
      }
    }

    return successResponse(res, 'Reviews updated successfully.', { addedReviews, removedReviews });
  } catch (error) {
    console.error('Error updating reviews:', error);
    next(error);
  }
};

module.exports = updateReview;
