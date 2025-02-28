const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');

const fetchRecommenderResponse = async (tmdbIds) => {
  try {
    if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
      throw new Error('Invalid input: TMDB IDs must be a non-empty array');
    }

    const response = await apiCore.post('/collaborative/v2/recommendations/item-based', tmdbIds);

    if (!response || response.status !== 200 || !response.data) {
      throw new Error('Failed to fetch recommendations from the service');
    }

    // Ensure response data is an array and contains valid tmdb_id values
    const recommendedIds = response.data
      .filter(item => item?.tmdb_id)  // Ensure tmdb_id exists
      .map(item => item.tmdb_id);

    if (recommendedIds.length === 0) {
      throw new Error('No valid recommendations received');
    }

    return recommendedIds;
  } catch (error) {
    console.error('Error connecting to the recommendation service:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.response?.status === 503) {
      throw new Error('Recommendation service is currently unavailable');
    }

    throw new Error('Error fetching recommendations');
  }
};

const recommenderCollabItem = async (req, res, next) => {
  try {
    let { tmdb_ids, mediaType = 'movie' } = req.body;

    if (!Array.isArray(tmdb_ids) || tmdb_ids.length === 0) {
      return errorResponse(res, 'No valid TMDB IDs provided', 400);
    }

    // Ensure all TMDB IDs are valid strings or numbers
    tmdb_ids = tmdb_ids.filter(id => typeof id === 'string' || typeof id === 'number');

    if (tmdb_ids.length === 0) {
      return errorResponse(res, 'No valid TMDB IDs after filtering', 400);
    }

    console.log('Collaborative Filtering: TMDB IDs:', tmdb_ids);

    const recommendedMediaIds = await fetchRecommenderResponse(tmdb_ids);

    console.log('Recommended TMDB IDs:', recommendedMediaIds);

    if (recommendedMediaIds.length === 0) {
      return errorResponse(res, 'No recommendations found', []);
    }

    // Fetch media details using fetchMediaDetailsService
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
    mediaDetailsArray = mediaDetailsArray.filter(Boolean); // Remove null values

    if (mediaDetailsArray.length === 0) {
      return errorResponse(res, 'Failed to fetch details for recommended items', []);
    }

    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error:', error.message);

    if (error.message.includes('Recommendation service is currently unavailable')) {
      return errorResponse(res, 'Recommendation service is currently unavailable. Please try again later.', 503);
    }

    return errorResponse(res, error.message, 500);
  }
};

module.exports = recommenderCollabItem;
