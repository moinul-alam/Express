const Media = require('@src/models/media');
const fetchMediaDetailsFromTMDB = require('@src/features/media/services/fetchMediaDetailsFromTMDB');
const { formatCredits, formatMediaData } = require('@src/features/media/helpers/mediaDetailsHelper');
const saveDataToDB = require('@src/features/media/services/saveDataToDB');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const SAVE_TO_DB = true;

const fetchMediaDetails = async (req, res, next) => {
  const { mediaType, id } = req.params;

  // Check if id is a valid number
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return errorResponse(res, 'Invalid media ID', 400);
  }

  try {
    const existingMedia = await Media.findOne({ tmdb_id: parsedId, media_type: mediaType });

    if (existingMedia) {
      const isOutdated = new Date() - new Date(existingMedia.updatedAt) > 7 * 24 * 60 * 60 * 1000;

      if (existingMedia.data_status === 'Complete' && !isOutdated) {
        return successResponse(res, 'Media data is up-to-date', existingMedia);
      }

      if (existingMedia.data_status === 'Partial' || isOutdated) {
        console.log(isOutdated ? 'Existing data is outdated, fetching fresh data.' : 'Existing data is partial, replacing with new data.');
      }
    }

    // Wrap TMDB API call in try-catch
    let mediaDetails, trailerDetails, creditDetails, keywordDetails;
    try {
      const response = await fetchMediaDetailsFromTMDB(mediaType, parsedId);
      mediaDetails = response.mediaDetails;
      trailerDetails = response.trailerDetails;
      creditDetails = response.creditDetails;
      keywordDetails = response.keywordDetails;
    } catch (error) {
      return errorResponse(res, 'Error fetching media details from TMDB', 500, error.message);
    }

    // Handle missing or malformed data from TMDB API
    if (!mediaDetails || !trailerDetails || !creditDetails || !keywordDetails) {
      return errorResponse(res, 'Incomplete data received from TMDB', 500, 'Some data fields are missing.');
    }

    // Safely extract trailer
    const officialTrailer = (trailerDetails.data.results || []).find(
      (video) => video.type === 'Trailer' && video.official === true
    );
    const trailerKey = officialTrailer ? officialTrailer.key : null;

    // Safely format credits
    let credits;
    try {
      credits = formatCredits(mediaType, creditDetails, mediaDetails);
    } catch (error) {
      return errorResponse(res, 'Error formatting credits', 500, error.message);
    }

    // Safely extract and format keywords
    const keywords = (keywordDetails.data.keywords || []).map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    }));

    // Safely format media data
    let data;
    try {
      data = formatMediaData(mediaType, mediaDetails, trailerKey, credits, keywords);
    } catch (error) {
      return errorResponse(res, 'Error formatting media data', 500, error.message);
    }

    // Save data to DB with error handling
    if (SAVE_TO_DB) {
      try {
        if (existingMedia) {
          await Media.findByIdAndUpdate(existingMedia._id, { ...data, data_status: 'Complete' }, { new: true });
          console.log('Existing media data updated with fresh data and status set to Complete.');
        } else {
          await saveDataToDB(Media, { ...data, data_status: 'Complete' });
          console.log('New data saved to DB with status Complete.');
        }
      } catch (error) {
        return errorResponse(res, 'Error saving media data to DB', 500, error.message);
      }
    }

    return successResponse(res, 'Media details fetched successfully', data);
  } catch (error) {
    console.error('Error in fetchMediaDetails:', error);
    return errorResponse(res, 'Error fetching media details', 500, error.message);
  }
};

module.exports = fetchMediaDetails;
