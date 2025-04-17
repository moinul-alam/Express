const api = require('@src/utils/api'); 
const apiCore = require('@src/utils/apiCore');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const recommenderContentSimilar = async (req, res, next) => {
  const { mediaType = 'movie' } = req.params;
  const { tmdb_ids } = req.body; // Expecting array of TMDB IDs in request body

  // Validate input
  if (!Array.isArray(tmdb_ids) || tmdb_ids.length === 0) {
    return errorResponse(res, 'Invalid or empty TMDB IDs array', 400);
  }

  try {
    // Fetch details for all provided TMDB IDs
    const mediaDetailsPromises = tmdb_ids.map(async (tmdbId) => {
      try {
        const result = await fetchMediaDetailsService(mediaType, tmdbId);
        if (!result || result.status !== 'success') {
          console.warn(`Skipping TMDB ID ${tmdbId} due to failed fetch`);
          return null;
        }
        return result.data;
      } catch (error) {
        console.error(`Error fetching details for TMDB ID ${tmdbId}:`, error.message);
        return null;
      }
    });

    let mediaDetailsArray = await Promise.all(mediaDetailsPromises);
    mediaDetailsArray = mediaDetailsArray.filter(Boolean);

    if (mediaDetailsArray.length === 0) {
      return errorResponse(res, 'No valid media details found for provided TMDB IDs', 404);
    }

    // Format metadata for all media items
    const formattedMetadata = {
      items: mediaDetailsArray.map(metadata => ({
        tmdb_id: parseInt(metadata.tmdb_id, 10),
        rating: 0,
        metadata: {
          media_type: metadata.media_type || mediaType,
          title: metadata.title || '',
          overview: metadata.overview || '',
          spoken_languages: metadata.spoken_languages 
            ? metadata.spoken_languages.map(lang => lang.iso_639_1) 
            : [],
          vote_average: typeof metadata.vote_average === 'number' 
            ? metadata.vote_average 
            : 0,
          release_year: metadata.release_date 
            ? new Date(metadata.release_date).getFullYear().toString() 
            : '',
          genres: metadata.genres 
            ? metadata.genres.map(genre => genre.name) 
            : [],
          director: metadata.credits 
            ? metadata.credits
                .filter(credit => credit.type === 'director' || credit.type === 'creator')
                .map(director => director.name) 
            : [],
          cast: metadata.credits 
            ? metadata.credits
                .filter(credit => credit.type === 'cast')
                .map(cast => cast.name) 
            : [],
          keywords: metadata.keywords 
            ? metadata.keywords.map(keyword => keyword.name) 
            : [],
        }
      })),
      n_recommendations: 10
    };

    try {
      const recommenderResponse = await apiCore.post('/content-based/v2/similar-items', formattedMetadata);

      console.log('Recommender Response: ', recommenderResponse.data);

      if (!recommenderResponse.data || recommenderResponse.status !== 200) {
        throw new Error('Failed to fetch recommendations from the service');
      }

      const similarMediaList = recommenderResponse.data.recommendations;

      // Fetch details of each similar media item
      const similarMediaDetailsPromises = similarMediaList.map(async (similarMedia) => {
        try {
          const tmdbId = similarMedia.tmdb_id;
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

      let similarMediaDetailsArray = await Promise.all(similarMediaDetailsPromises);
      similarMediaDetailsArray = similarMediaDetailsArray.filter(Boolean);

      console.log('Backend: Filtered Similar Media Details Array: ', similarMediaDetailsArray.length);
      return successResponse(res, 'Similar media fetched successfully', similarMediaDetailsArray);
    } catch (recommenderError) {
      console.error('Error connecting to the recommender:', recommenderError.message);
      return errorResponse(res, 'Error connecting to the recommendation service', 503);
    }
  } catch (error) {
    console.error('Error fetching media details or processing recommendations:', error.message);
    return errorResponse(res, error.message || 'Internal Server Error', 500);
  }
};

module.exports = recommenderContentSimilar;