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
    return response.data.similarMedia;
  } catch (error) {
    throw new Error('Error connecting to the recommendation service');
  }
};

const fetchMediaDetails = async (mediaType, similarMediaList) => {
  const mediaDetailsPromises = similarMediaList.map(async (similarMedia) => {
    try {
      const tmdbId = similarMedia.tmdb_id;
      const mediaDetails = await api.get(`/${mediaType}/${tmdbId}`);
      return mediaDetails.data;
    } catch (error) {
      console.error(`Failed to fetch details for TMDB ID ${tmdbId}:`, error.message);
      return { tmdbId, error: 'Failed to fetch media details' };
    }
  });
  return await Promise.all(mediaDetailsPromises);
};

const recommendSimilarMedia = async (req, res, next) => {
  const { mediaType, ratings } = req.body;

  try {
    console.log('Fetching media details for collaborative filtering: ', ratings);
    const similarMediaList = await fetchRecommenderResponse(ratings);
    const mediaDetailsArray = await fetchMediaDetails(mediaType, similarMediaList);
    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error:', error.message);
    return errorResponse(res, error.message, 503);
  }
};

module.exports = recommendSimilarMedia;