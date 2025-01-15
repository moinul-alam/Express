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
    const existingMedia = await Media.findOne({ tmdb_id: parsedId });

    if (existingMedia) {
      const isOutdated = new Date() - new Date(existingMedia.updatedAt) > 7 * 24 * 60 * 60 * 1000;

      if (existingMedia.data_status === 'Complete' && !isOutdated) {
        return successResponse(res, 'Media data is up-to-date', existingMedia);
      }

      if (existingMedia.data_status === 'Partial' || isOutdated) {
        console.log(isOutdated ? 'Existing data is outdated, fetching fresh data.' : 'Existing data is partial, replacing with new data.');
      }
    }

    const { mediaDetails, trailerDetails, creditDetails } = await fetchMediaDetailsFromTMDB(mediaType, parsedId);
    const officialTrailer = trailerDetails.data.results.find(
      (video) => video.type === 'Trailer' && video.official === true
    );
    const trailerKey = officialTrailer ? officialTrailer.key : null;
    const credits = formatCredits(mediaType, creditDetails, mediaDetails);
    const data = formatMediaData(mediaType, mediaDetails, trailerKey, credits);

    if (SAVE_TO_DB) {
      if (existingMedia) {
        await Media.findByIdAndUpdate(existingMedia._id, { ...data, data_status: 'Complete' }, { new: true });
        console.log('Existing media data updated with fresh data and status set to Complete.');
      } else {
        await saveDataToDB(Media, { ...data, data_status: 'Complete' });
        console.log('New data saved to DB with status Complete.');
      }
    }

    return successResponse(res, 'Media details fetched successfully', data);
  } catch (error) {
    console.error('Error fetching or saving media details:', error);
    return errorResponse(res, 'Error fetching or saving media details', 500, error.message);
  }
};

module.exports = fetchMediaDetails;
