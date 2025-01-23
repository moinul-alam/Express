const api = require('@src/utils/api'); 
const apiCore = require('@src/utils/apiCore');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const recommendSimilarMedia = async (req, res, next) => {
  const { mediaType, mediaId } = req.params; 
  const { n_items = 10 } = req.query; 

  try {
    // Fetch media details for the given mediaId
    const result = await fetchMediaDetailsService(mediaType, mediaId);

    if (!result || result.status !== 'success') {
      return errorResponse(res, 'Failed to fetch media details', 404);
    }

    const metadata = result.data;

    try {
      const recommenderResponse = await apiCore.post('/content-based/v1/similar',
        {
          tmdbId: parseInt(mediaId, 10),
          metadata,
        },
        {
          params: {
            n_items,
          },
        }
      );

      if (!recommenderResponse || recommenderResponse.status !== 200) {
        throw new Error('Failed to fetch recommendations from the service');
      }

      const similarMediaList = recommenderResponse.data.similarMedia;

      // Fetch details of each similar media item
      const mediaDetailsPromises = similarMediaList.map(async (similarMedia) => {
        try {
          const mediaDetails = await api.get(`/${mediaType}/${similarMedia.tmdbId}`);
          return mediaDetails.data;
        } catch (error) {
          console.error(`Failed to fetch details for TMDB ID ${similarMedia.tmdbId}:`, error.message);
          return { tmdbId: similarMedia.tmdbId, error: 'Failed to fetch media details' };
        }
      });

      const mediaDetailsArray = await Promise.all(mediaDetailsPromises);

      return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
    } catch (recommenderError) {
      console.error('Error connecting to the recommender:', recommenderError.message);
      return errorResponse(res, 'Error connecting to the recommendation service', 503);
    }
  } catch (error) {
    console.error('Error fetching media details or processing recommendations:', error.message);
    return errorResponse(res, error.message || 'Internal Server Error', 500);
  }
};

module.exports = recommendSimilarMedia;
