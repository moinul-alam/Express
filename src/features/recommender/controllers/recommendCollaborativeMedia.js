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

    return response.data.map(item => item.tmdb_id);
  } catch (error) {
    console.error('Error connecting to the recommendation service:', error.message);

    // Handle service down/unreachable cases explicitly
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.response?.status === 503) {
      throw new Error('Recommendation service is currently unavailable');
    }

    throw new Error('Error fetching recommendations');
  }
};

const fetchMediaDetails = async (mediaType, tmdbIdList) => {
  const mediaDetailsPromises = tmdbIdList.map(async (tmdbId) => {
    try {
      const mediaDetails = await api.get(`/${mediaType}/${tmdbId}`);
      return mediaDetails.data;
    } catch (error) {
      console.error(`Failed to fetch details for TMDB ID ${tmdbId}:`, error.message);
      return { tmdbId, error: 'Failed to fetch media details' };
    }
  });
  return await Promise.all(mediaDetailsPromises);
};

const recommendCollaborativeMedia = async (req, res, next) => {
  const { mediaType, ratings } = req.body;

  try {
    console.log('Collaborative Filtering: TMDB ID and Ratings:', ratings);
    
    const MediaList = await fetchRecommenderResponse(ratings);

    if (!MediaList || MediaList.length === 0) {
      console.log('No recommendations found for the given ratings.');
      return errorResponse(res, 'No recommendations found', []);
    }

    const mediaDetailsArray = await fetchMediaDetails(mediaType, MediaList);
    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error:', error.message);

    if (error.message === 'Recommendation service is currently unavailable') {
      return errorResponse(res, 'Recommendation service is currently unavailable. Please try again later.', 503);
    }

    return errorResponse(res, error.message, 500);
  }
};

module.exports = recommendCollaborativeMedia;
