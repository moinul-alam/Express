const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchRecommenderResponse = async (ratings) => {
  try {
    const response = await apiCore.post('/collaborative/v2/recommendations', ratings);
    if (!response || response.status !== 200) {
      throw new Error('Failed to fetch recommendations from the service');
    }

    // Check if response.data exists and contains the array
    if (!response.data) {
      throw new Error('Invalid response format from recommendation service');
    }

    // Since we can see the actual response format from your example,
    // we can directly use it without assuming any nested structure
    const tmdbIds = response.data.map(item => item.tmdb_id);
    return tmdbIds;
  } catch (error) {
    console.error('Error connecting to the recommendation service:', error.message);
    throw new Error('Error connecting to the recommendation service');
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
    console.log('Fetching media details for collaborative filtering:', ratings);
    const MediaList = await fetchRecommenderResponse(ratings);

    console.log('MediaList:', MediaList);

    if (!MediaList || MediaList.length === 0) {
      console.log('No recommendations found for the given ratings.');
      return successResponse(res, 'No recommendations found', []);
    }

    const mediaDetailsArray = await fetchMediaDetails(mediaType, MediaList);
    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error:', error.message);
    return errorResponse(res, error.message, 503);
  }
};

module.exports = recommendCollaborativeMedia;