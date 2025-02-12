const Media = require('@src/models/media');
const Review = require('@src/models/review');
const fetchMediaDetailsFromTMDB = require('@src/features/media/services/fetchMediaDetailsFromTMDB');
const { formatCredits, formatMediaData } = require('@src/features/media/helpers/mediaDetailsHelper');
const saveDataToDB = require('@src/features/media/services/saveDataToDB');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const SAVE_TO_DB = true;

const fetchMediaDetails = async (req, res, next) => {
  const { mediaType, id } = req.params;

  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return errorResponse(res, 'Invalid media ID', 400);
  }

  try {
    const existingMedia = await Media.findOne({ tmdb_id: parsedId, media_type: mediaType });

    if (existingMedia) {
      const isOutdated = new Date() - new Date(existingMedia.updatedAt) > 7 * 24 * 60 * 60 * 1000;

      if (existingMedia.data_status === 'Complete' && !isOutdated) {
        const reviews = await Review.find({ mediaId: existingMedia._id })
          .populate('userId', 'info.firstName info.lastName')
          .select('rating comment createdAt');

        return successResponse(res, 'Media data is up-to-date', {
          ...existingMedia.toObject(),
          reviews,
        });
      }

      console.log(
        existingMedia.data_status === 'Partial'
          ? 'Existing data is partial, replacing with new data.'
          : 'Existing data is outdated, fetching fresh data.'
      );
    }

    let mediaDetails, trailerDetails, creditDetails, keywordDetails;
    try {
      const response = await fetchMediaDetailsFromTMDB(mediaType, parsedId);
      mediaDetails = response.mediaDetails;
      trailerDetails = response.trailerDetails;
      creditDetails = response.creditDetails;
      keywordDetails = response.keywordDetails;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return errorResponse(res, 'Media not found', 404);
      }
      return errorResponse(res, 'Error fetching media details from TMDB', 500, error.message);
    }

    if (!mediaDetails || !trailerDetails || !creditDetails || !keywordDetails) {
      return errorResponse(res, 'Incomplete data received from TMDB', 500, 'Some data fields are missing.');
    }

    const officialTrailer = (trailerDetails.data.results || []).find(
      (video) => video.type === 'Trailer' && video.official === true
    );
    const trailerKey = officialTrailer ? officialTrailer.key : null;

    let credits;
    try {
      credits = formatCredits(mediaType, creditDetails, mediaDetails);
    } catch (error) {
      return errorResponse(res, 'Error formatting credits', 500, error.message);
    }

    const keywords = (keywordDetails.data.keywords || []).map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    }));

    let data;
    try {
      data = formatMediaData(mediaType, mediaDetails, trailerKey, credits, keywords);
    } catch (error) {
      return errorResponse(res, 'Error formatting media data', 500, error.message);
    }

    let updatedMedia;
    if (SAVE_TO_DB) {
      try {
        if (existingMedia) {
          updatedMedia = await Media.findByIdAndUpdate(existingMedia._id, { ...data, data_status: 'Complete' }, { new: true });
          console.log('Existing media data updated with fresh data and status set to Complete.');
        } else {
          updatedMedia = await saveDataToDB(Media, { ...data, data_status: 'Complete' });
          console.log('New data saved to DB with status Complete.');
        }
      } catch (error) {
        return errorResponse(res, 'Error saving media data to DB', 500, error.message);
      }
    }

    // Fetch reviews after media is saved/updated
    const mediaId = updatedMedia ? updatedMedia._id : existingMedia._id;
    const reviews = await Review.find({ mediaId: mediaId })
      .populate('userId', 'username')
      .select('rating comment createdAt');

    return successResponse(res, 'Media details fetched successfully', { ...data, reviews });
  } catch (error) {
    console.error('Error in fetchMediaDetails:', error);
    return errorResponse(res, 'Error fetching media details', 500, error.message);
  }
};

module.exports = fetchMediaDetails;