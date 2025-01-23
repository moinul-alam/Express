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
    const existingMedia = await Media.findOne({ tmdb_id: parsedId });
    if (existingMedia) {
      return { status: 'success', data: existingMedia };
    }

    // Fetch media details from TMDB
    const { mediaDetails, creditDetails } = await fetchMediaDetailsFromTMDB(mediaType, parsedId);

    // Format media data
    const credits = creditDetails ? formatCredits(mediaType, creditDetails, mediaDetails) : null;
    const data = formatMediaData(mediaType, mediaDetails, credits);

    return { status: 'success', data };
  } catch (error) {
    console.error('Error fetching media details:', error);
    throw new Error('Error fetching media details');
  }
};

module.exports = fetchMediaDetailsService;
