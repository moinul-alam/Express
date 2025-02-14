const Media = require('@src/models/media');
const fetchMediaDetailsFromTMDB = require('@src/features/media/services/fetchMediaDetailsFromTMDB');
const { formatCredits, formatMediaData } = require('@src/features/media/helpers/mediaDetailsHelper');

const fetchMediaDetailsService = async (mediaType, mediaId) => {
  // Parse and validate media ID
  const parsedId = parseInt(mediaId, 10);
  if (isNaN(parsedId)) {
    throw new Error('Invalid media ID');
  }

  try {
    // Check if media exists in the database
    const existingMedia = await Media.findOne({ tmdb_id: parsedId, media_type: mediaType });
    if (existingMedia) {
      return { status: 'success', data: existingMedia };
    }

    // Fetch media details from TMDB
    let mediaDetails, trailerDetails, creditDetails, keywordDetails;

    try {
      ({ mediaDetails, trailerDetails, creditDetails, keywordDetails } = 
        await fetchMediaDetailsFromTMDB(mediaType, parsedId));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { status: 'not_found', message: 'Media not found on TMDB' };
      }
      console.error('Error fetching data from TMDB:', error.message);
      throw new Error('Failed to fetch media details');
    }

    // Ensure all necessary details exist
    if (!mediaDetails || !trailerDetails || !creditDetails || !keywordDetails) {
      return { status: 'error', message: 'Incomplete data received from TMDB' };
    }

    // Extract official trailer key
    const officialTrailer = (trailerDetails.data.results || []).find(
      (video) => video.type === 'Trailer' && video.official === true
    );
    const trailerKey = officialTrailer ? officialTrailer.key : null;

    // Format credits
    let credits = {};
    try {
      credits = formatCredits(mediaType, creditDetails, mediaDetails);
    } catch (error) {
      console.error(`Error formatting credits: ${error.message}`);
    }

    // Extract keywords
    const keywords = (keywordDetails.data.keywords || keywordDetails.data.results || []).map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    }));

    // Format final media data
    let data = {};
    try {
      data = formatMediaData(mediaType, mediaDetails, trailerKey, credits, keywords);
    } catch (error) {
      console.error(`Error formatting media data: ${error.message}`);
    }

    return { status: 'success', data };
  } catch (error) {
    console.error('Unexpected error fetching media details:', error);
    return { status: 'error', message: 'An unexpected error occurred' };
  }
};

module.exports = fetchMediaDetailsService;
