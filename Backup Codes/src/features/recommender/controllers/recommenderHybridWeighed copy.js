const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const fetchMetadataHelper = require('@src/features/recommender/helpers/getMetadata');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchRecommenderResponse = async (ratings, metadata) => {
  try {
    const payload = {
      ratings,
      metadata, // Sending the metadata along with ratings
    };

    const response = await apiCore.post('/hybrid/v1/recommendations/weighed', payload);

    if (!response || response.status !== 200) {
      throw new Error('Failed to fetch recommendations from the service');
    }

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from recommendation service');
    }

    return response.data.map(item => item.tmdb_id);
  } catch (error) {
    console.error('Error connecting to the recommendation service:', error.message);

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
      return null; 
    }
  });

  const mediaDetailsArray = await Promise.all(mediaDetailsPromises);

  return mediaDetailsArray.filter(details => details !== null);
};

const recommenderHybridWeighed = async (req, res, next) => {
  const { mediaType = 'movie', ratings } = req.body;

  if (!Array.isArray(ratings) || ratings.length === 0) {
    return errorResponse(res, 'Invalid or empty list of ratings', 400);
  }

  try {
    // Fetch metadata for rated TMDB IDs
    const tmdbIds = ratings.map(item => item.tmdb_id);
    const metadata = await fetchMetadataHelper(tmdbIds, mediaType);
    
    console.log('Fetched Metadata:', metadata);

    // Call the recommendation system with ratings and metadata
    const recommendedTmdbIds = await fetchRecommenderResponse(ratings, metadata);

    if (!recommendedTmdbIds || recommendedTmdbIds.length === 0) {
      console.log('No recommendations found for the given ratings.');
      return errorResponse(res, 'No recommendations found', 404);
    }

    // Fetch detailed media information for recommended TMDB IDs
    const mediaDetailsArray = await fetchMediaDetails(mediaType, recommendedTmdbIds);
    
    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error:', error.message);

    if (error.message === 'Recommendation service is currently unavailable') {
      return errorResponse(res, 'Recommendation service is currently unavailable. Please try again later.', 503);
    }

    return errorResponse(res, error.message, 500);
  }
};

module.exports = recommenderHybridWeighed;
