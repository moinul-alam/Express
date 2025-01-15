const axios = require('axios');
const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchSimilarRecommendations = async (req, res, next) => {
  const { mediaType, mediaId } = req.params;

  const page = req.query.page || 1;

  try {
    // Fetch similar media from the FastAPI server
    const similar = await axios.get(`http://localhost:5000/api/v1/similar/${mediaId}`, {
      params: { page },
    }).catch((error) => {
      console.error('Error connecting to the FastAPI endpoint:', error.message);
      throw new Error('Not Found! Try searching another...');
    });

    if (!similar || similar.status !== 200) {
      return errorResponse(res, 'Failed to fetch similar media from the recommendation service', 503);
    }

    const similarMediaData = similar.data;
    const { similarMedia } = similarMediaData;

    // Fetch details of each similar media
    const mediaDetailsPromises = similarMedia.map(async (media) => {
      try {
        const mediaDetails = await api.get(`/${mediaType}/${media.tmdbId}`);
        return mediaDetails.data;
      } catch (error) {
        console.error(`Error fetching details for TMDB ID ${media.tmdbId}:`, error.message);
        // Return a placeholder or partial data for the failed request
        return { tmdbId: media.tmdbId, error: 'Failed to fetch media details' };
      }
    });

    // Wait for all requests to complete
    const mediaDetailsArray = await Promise.all(mediaDetailsPromises);

    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error fetching similar media:', error.message);
    return errorResponse(res, error.message || 'Error fetching similar media', 500);
  }
};

module.exports = fetchSimilarRecommendations;
