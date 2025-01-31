const api = require('@src/utils/api'); 
const apiCore = require('@src/utils/apiCore');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const recommendSimilarMedia = async (req, res, next) => {
  const { mediaType, mediaId } = req.params;

  try {
    // Fetch media details for the given mediaId
    const result = await fetchMediaDetailsService(mediaType, mediaId);

    if (!result || result.status !== 'success') {
      return errorResponse(res, 'Failed to fetch media details', 404);
    }

    const metadata = result.data;

    // Transform the metadata into the expected format
    const formattedMetadata = {
      tmdb_id: parseInt(metadata.tmdb_id, 10),
      metadata: {
        media_type: metadata.media_type,
        title: metadata.title || '',
        overview: metadata.overview || '',
        vote_average: typeof metadata.vote_average === 'number' ? metadata.vote_average : 0,
        release_year: metadata.release_date
          ? new Date(metadata.release_date).getFullYear().toString()
          : '',
        genres: metadata.genres ? metadata.genres.map((genre) => genre.name) : [],
        director: metadata.credits
          ? metadata.credits
              .filter((credit) => credit.type === 'director')
              .map((director) => director.name)
          : [],
        cast: metadata.credits
          ? metadata.credits
              .filter((credit) => credit.type === 'cast')
              .map((castMember) => castMember.name)
          : [],
        keywords: metadata.keywords ? metadata.keywords.map((keyword) => keyword.name) : [],
      },
    };    

    console.log(formattedMetadata);

    try {
      const recommenderResponse = await apiCore.post('/content-based/v2/similar', formattedMetadata);

      if (!recommenderResponse || recommenderResponse.status !== 200) {
        throw new Error('Failed to fetch recommendations from the service');
      }

      const similarMediaList = recommenderResponse.data.similarMedia;

      // Fetch details of each similar media item
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
