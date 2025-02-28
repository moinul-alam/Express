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
  
  let existingMedia = null;

  if (isNaN(parsedId)) {
    return errorResponse(res, 'Invalid media ID', null, 400);
  }

  try {
    // Find the media in the database
    existingMedia = await Media.findOne({ tmdb_id: parsedId, media_type: mediaType });

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
          ? 'Existing data is partial, attempting to replace with fresh data.'
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
      console.error(`Error fetching media details from TMDB: ${error.message}`);

      if (existingMedia) {
        console.warn('Returning existing media since TMDB fetch failed.');
        const reviews = await Review.find({ mediaId: existingMedia._id })
          .populate('userId', 'username')
          .select('rating comment createdAt');

        return successResponse(res, 'Returning existing media due to TMDB fetch failure', {
          ...existingMedia.toObject(),
          reviews,
        });
      }

      return errorResponse(res, 'Error fetching media details from TMDB', error.message, 500);
    }

    // Validate all required data is present
    if (!mediaDetails || !trailerDetails || !creditDetails || !keywordDetails) {
      console.error('Incomplete data received from TMDB.');
      
      if (existingMedia) {
        console.warn('Returning existing media as a fallback.');
        const reviews = await Review.find({ mediaId: existingMedia._id })
          .populate('userId', 'username')
          .select('rating comment createdAt');

        return successResponse(res, 'Returning existing media due to incomplete TMDB data', {
          ...existingMedia.toObject(),
          reviews,
        });
      }

      return errorResponse(res, 'Incomplete data received from TMDB', 'Some data fields are missing.', 500);
    }

    const officialTrailer = (trailerDetails.data && trailerDetails.data.results || []).find(
      (video) => video.type === 'Trailer' && video.official === true
    );
    const trailerKey = officialTrailer ? officialTrailer.key : null;

    let credits;
    try {
      credits = formatCredits(mediaType, creditDetails, mediaDetails);
    } catch (error) {
      console.error(`Error formatting credits: ${error.message}`);

      if (existingMedia) {
        console.warn('Returning existing media as a fallback.');
        const reviews = await Review.find({ mediaId: existingMedia._id })
          .select('rating comment createdAt')
          .populate('userId', 'username');
        
        return successResponse(res, 'Returning existing media due to credit formatting error', {
          ...existingMedia.toObject(),
          reviews,
        });
      }

      return errorResponse(res, 'Error formatting credits', error.message, 500);
    }

    // Safely extract keywords
    const keywords = [];
    if (keywordDetails && keywordDetails.data) {
      const keywordSource = keywordDetails.data.keywords || keywordDetails.data.results || [];
      keywordSource.forEach(keyword => {
        if (keyword && typeof keyword.id === 'number' && typeof keyword.name === 'string') {
          keywords.push({
            id: keyword.id,
            name: keyword.name,
          });
        }
      });
    }

    let data;
    try {
      data = formatMediaData(mediaType, mediaDetails, trailerKey, credits, keywords);
    } catch (error) {
      console.error(`Error formatting media data: ${error.message}`);

      if (existingMedia) {
        console.warn('Returning existing media as a fallback.');
        const reviews = await Review.find({ mediaId: existingMedia._id })
          .select('rating comment createdAt')
          .populate('userId', 'username');
        
        return successResponse(res, 'Returning existing media due to media data formatting error', {
          ...existingMedia.toObject(),
          reviews,
        });
      }

      return errorResponse(res, 'Error formatting media data', error.message, 500);
    }

    let updatedMedia;
    if (SAVE_TO_DB) {
      try {
        if (existingMedia) {
          updatedMedia = await Media.findByIdAndUpdate(
            existingMedia._id,
            { ...data, data_status: 'Complete' },
            { new: true }
          );
          console.log('Existing media data updated with fresh data and status set to Complete.');
        } else {
          updatedMedia = await saveDataToDB(Media, { ...data, data_status: 'Complete' });
          console.log('New data saved to DB with status Complete.');
        }
      } catch (error) {
        console.error(`Error saving media data to DB: ${error.message}`);

        if (existingMedia) {
          console.warn('Returning existing media as a fallback.');
          const reviews = await Review.find({ mediaId: existingMedia._id })
            .select('rating comment createdAt')
            .populate('userId', 'username');
          
          return successResponse(res, 'Returning existing media due to DB save error', {
            ...existingMedia.toObject(),
            reviews,
          });
        }

        return errorResponse(res, 'Error saving media data to DB', error.message, 500);
      }
    }

    const mediaId = updatedMedia ? updatedMedia._id : (existingMedia ? existingMedia._id : null);
    
    // Only try to fetch reviews if we have a valid mediaId
    let reviews = [];
    if (mediaId) {
      try {
        reviews = await Review.find({ mediaId })
          .populate('userId', 'username')
          .select('rating comment createdAt');
      } catch (error) {
        console.error(`Error fetching reviews: ${error.message}`);
        // Continue without reviews rather than failing the entire request
      }
    }

    return successResponse(res, 'Media details fetched successfully', { ...data, reviews });
  } catch (error) {
    console.error(`Unexpected error in fetchMediaDetails: ${error.message}`);

    // This now works because existingMedia is declared at the function level
    if (existingMedia) {
      console.warn('Returning existing media as a fallback.');
      try {
        const reviews = await Review.find({ mediaId: existingMedia._id })
          .populate('userId', 'username')
          .select('rating comment createdAt');
        
        return successResponse(res, 'Returning existing media due to an unexpected error', {
          ...existingMedia.toObject(),
          reviews,
        });
      } catch (reviewError) {
        console.error(`Error fetching reviews in error handler: ${reviewError.message}`);
        return successResponse(res, 'Returning existing media due to an unexpected error', {
          ...existingMedia.toObject(),
          reviews: [],
        });
      }
    }

    return errorResponse(res, 'Unexpected error fetching media details', error.message, 500);
  }
};

module.exports = fetchMediaDetails;