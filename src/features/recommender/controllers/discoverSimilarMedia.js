const { v4: uuidv4 } = require('uuid');
const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const generateTmdbId = () => {
  const uuidNumeric = BigInt('0x' + uuidv4().replace(/-/g, '')).toString();
  return Number(uuidNumeric.slice(0, 10)); // Ensure 10-digit tmdb_id
};

const discoverSimilarMedia = async (req, res, next) => {
  try {
    const { metadata } = req.body;
    if (!metadata) {
      return errorResponse(res, 'Metadata is required', 400);
    }

    const media_type = metadata.media_type || ''; 

    let {
      title = '',
      overview,
      spoken_languages = [],  
      vote_average = 0,    
      release_year = '',
      genres = [],           
      director = [],         
      cast = [],            
      keywords = []         
    } = metadata;

    // Validation checks
    if (!overview || typeof overview !== 'string' || !overview.trim()) {
      return errorResponse(res, 'Overview is required', 400);
    }

    if (!Array.isArray(genres) || genres.length === 0) {
      return errorResponse(res, 'Genres are required and must be an array', 400);
    }

    // Ensure arrays are properly formatted
    const validateArray = (arr, fieldName) => {
      if (!Array.isArray(arr)) {
        throw new Error(`${fieldName} must be an array`);
      }
      return arr.map(item => item.toString().trim().toLowerCase());
    };

    // Format all arrays
    genres = validateArray(genres, 'genres');
    spoken_languages = validateArray(spoken_languages, 'spoken_languages');
    director = validateArray(director, 'director');
    cast = validateArray(cast, 'cast');
    keywords = validateArray(keywords, 'keywords');

    // Ensure vote_average is a valid number
    vote_average = typeof vote_average === 'number' ? vote_average : 0;

    // Generate a random 10-digit tmdb_id
    const tmdb_id = generateTmdbId();

    // Format data for the recommender system
    const formattedMetadata = {
      tmdb_id,
      metadata: {
        media_type,         // Changed to match schema
        title,
        overview,
        spoken_languages,
        vote_average,
        release_year,
        genres,
        director,
        cast,
        keywords
      }
    };

    console.log('Formatted metadata:', JSON.stringify(formattedMetadata, null, 2));

    // Send request to the recommender system
    const recommenderResponse = await apiCore.post('/content-based/v2/discover', formattedMetadata);

    if (!recommenderResponse?.data?.similarMedia) {
      throw new Error('Invalid response from recommender service');
    }

    const similarMediaList = recommenderResponse.data.similarMedia;

    // Fetch details of each recommended media item
    const mediaDetailsPromises = similarMediaList.map(async (similarMedia) => {
      try {
        const tmdbId = similarMedia.tmdb_id;
        const mediaDetails = await api.get(`/${media_type}/${tmdbId}`);
        return mediaDetails.data;
      } catch (error) {
        console.error(`Failed to fetch details for TMDB ID ${similarMedia.tmdb_id}:`, error.message);
        return null;
      }
    });

    const mediaDetailsArray = (await Promise.all(mediaDetailsPromises));

    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error processing request:', error);
    return errorResponse(res, error.message || 'Internal Server Error', 500);
  }
};

module.exports = discoverSimilarMedia;