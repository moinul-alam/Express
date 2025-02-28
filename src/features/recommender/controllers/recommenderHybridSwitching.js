const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');

const fetchRecommenderResponse = async (payload) => {
  try {
    const response = await apiCore.post('/hybrid/v1/recommendations/switching', payload);

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
      return null; // Skip failed fetches
    }
  });

  const mediaDetailsArray = await Promise.all(mediaDetailsPromises);
  return mediaDetailsArray.filter(details => details !== null);
};

const recommenderHybridSwitching = async (req, res, next) => {
  const { mediaType = 'movie', ratings } = req.body;

  console.log('Received Ratings:', ratings);

  if (!Array.isArray(ratings) || ratings.length === 0) {
    return errorResponse(res, 'Invalid or empty list of ratings', 400);
  }

  try {
    // Convert ratings array to expected dictionary format
    const ratingsDict = {};
    ratings.forEach(({ tmdb_id, rating }) => {
      ratingsDict[tmdb_id] = rating;
    });

    // Fetch metadata for each rated movie
    const mediaDetailsPromises = ratings.map(async ({ tmdb_id }) => {
      try {
        const result = await fetchMediaDetailsService(mediaType, tmdb_id);
        console.log(`Raw response for TMDB ID ${tmdb_id}:`, result);

        if (!result || result.status !== 'success') {
          console.warn(`Failed to fetch details for TMDB ID ${tmdb_id}:`, result?.status || 'No status');
          return null;
        }

        const metadata = result.data;

        return {
          tmdb_id: parseInt(metadata.tmdb_id, 10),
          metadata: {
            media_type: metadata.media_type || mediaType,
            title: metadata.title || '',
            overview: metadata.overview || '',
            spoken_languages: metadata.spoken_languages ? metadata.spoken_languages.map(lang => lang.iso_639_1) : [],
            vote_average: typeof metadata.vote_average === 'number' ? metadata.vote_average : 0,
            release_year: metadata.release_date ? new Date(metadata.release_date).getFullYear().toString() : '',
            genres: metadata.genres ? metadata.genres.map(genre => genre.name) : [],
            director: metadata.credits
              ? metadata.credits
                  .filter(credit => credit.type === 'director' || credit.type === 'creator')
                  .map(director => director.name)
              : [],
            cast: metadata.credits
              ? metadata.credits.filter(credit => credit.type === 'cast').map(cast => cast.name)
              : [],
            keywords: metadata.keywords ? metadata.keywords.map(keyword => keyword.name) : [],
          },
        };
      } catch (error) {
        console.error(`Error fetching details for TMDB ID ${tmdb_id}:`, error.message);
        return null;
      }
    });

    const formattedMetadataArray = await Promise.all(mediaDetailsPromises);
    const request_data = formattedMetadataArray.filter(Boolean);

    console.log('Filtered Metadata Array:', request_data);

    // Construct payload for the recommendation service
    const payload = {
      ratings: ratingsDict,
      request_data,
    };

    console.log('Sending payload to recommender:', JSON.stringify(payload, null, 2));

    // Fetch recommendations
    const recommendedTmdbIds = await fetchRecommenderResponse(payload);

    if (!recommendedTmdbIds || recommendedTmdbIds.length === 0) {
      console.log('No recommendations found for the given ratings.');
      return errorResponse(res, 'No recommendations found', 404);
    }

    // Fetch media details for recommended movies
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

module.exports = recommenderHybridSwitching;
