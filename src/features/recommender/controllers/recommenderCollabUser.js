const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchRecommenderResponse = async (ratings) => {
  try {
    const response = await apiCore.post('/collaborative/v2/recommendations/user-based', ratings);

    if (!response || response.status !== 200) {
      throw new Error('Failed to fetch recommendations from the service');
    }

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from recommendation service');
    }

    return response.data.map(item => item.tmdb_id).filter(Boolean); // Filter out invalid or missing IDs
  } catch (error) {
    console.error('Error connecting to the recommendation service:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.response?.status === 503) {
      throw new Error('Recommendation service is currently unavailable');
    }

    throw new Error('Error fetching recommendations');
  }
};

const validateRatings = (ratings) => {
  if (typeof ratings !== 'object' || ratings === null || Object.keys(ratings).length === 0) {
    return false;
  }

  for (const [key, value] of Object.entries(ratings)) {
    if (
      (typeof key !== 'string' && typeof key !== 'number') || 
      typeof value !== 'number' || 
      value < 1 || 
      value > 5
    ) {
      console.warn(`Invalid rating entry skipped: ${key}: ${value}`);
      return false;
    }
  }
  return true;
};

const recommenderCollabUser = async (req, res, next) => {
  const { mediaType = 'movie', ratings } = req.body;

  if (!validateRatings(ratings)) {
    console.error('Invalid ratings input received:', ratings);
    return errorResponse(res, 'Invalid ratings format. Expected {tmdb_id: rating}', 400);
  }

  try {
    console.log('Collaborative Filtering: TMDB ID and Ratings:', ratings);

    const recommendedMediaIds = await fetchRecommenderResponse(ratings);

    if (!recommendedMediaIds || recommendedMediaIds.length === 0) {
      console.log('No recommendations found for the given ratings.');
      return errorResponse(res, 'No recommendations found', []);
    }

    const mediaDetailsPromises = recommendedMediaIds.map(async (tmdbId) => {
      try {
        const mediaDetails = await fetchMediaDetailsService(mediaType, tmdbId);

        if (!mediaDetails || mediaDetails.status === 'not_found' || !mediaDetails.data) {
          console.warn(`Skipping TMDB ID ${tmdbId} due to missing details.`);
          return null;
        }

        return mediaDetails.data;
      } catch (error) {
        console.error(`Failed to fetch details for TMDB ID ${tmdbId}:`, error.message);
        return null;
      }
    });

    let mediaDetailsArray = await Promise.all(mediaDetailsPromises);
    mediaDetailsArray = mediaDetailsArray.filter(Boolean);

    if (mediaDetailsArray.length === 0) {
      return errorResponse(res, 'Failed to fetch details for recommended items', []);
    }

    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error:', error.message);

    if (error.message === 'Recommendation service is currently unavailable') {
      return errorResponse(res, 'Recommendation service is currently unavailable. Please try again later.', 503);
    }

    return errorResponse(res, error.message, 500);
  }
};

module.exports = recommenderCollabUser;
