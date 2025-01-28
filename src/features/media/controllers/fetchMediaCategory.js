const api = require('@src/utils/api');
const Media = require('@src/models/media');
const CategoricalMedia = require('@src/models/categoricalMedia');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');
const moment = require('moment');

const fetchMediaCategory = async (req, res, next) => {
  const { mediaType, mediaCategory } = req.params;
  const page = req.query.page || 1;

  let endpoint = `/${mediaType}/${mediaCategory}`;

  if (mediaCategory === 'trending') {
    const timeWindow = req.query.timeWindow || 'day';
    endpoint = `/trending/${mediaType}/${timeWindow}`;
  }

  try {
    // Attempt to fetch data from TMDB
    const response = await api.get(endpoint, { params: { page } });
    const freshData = response.data.results;

    // Update `categoricalMedia` if data is older than 7 days
    const categoryRecord = await CategoricalMedia.findOne({
      category: mediaCategory,
      media_type: mediaType, // Match both category and media type
    });
    const isOutdated = categoryRecord && moment(categoryRecord.updatedAt).isBefore(moment().subtract(7, 'days'));

    if (!categoryRecord || isOutdated) {
      const mediaIds = [];

      for (const mediaItem of freshData) {
        let media = await Media.findOne({ tmdb_id: mediaItem.id });

        if (!media) {
          // Save media if it doesn't exist
          media = await Media.create({
            data_status: 'Partial',
            tmdb_id: mediaItem.id,
            media_type: mediaType,
            title: mediaItem.title || mediaItem.name,
            genre: mediaItem.genre_ids,
            overview: mediaItem.overview,
            release_date: mediaItem.release_date || mediaItem.first_air_date,
            popularity: mediaItem.popularity,
            vote_average: mediaItem.vote_average,
            vote_count: mediaItem.vote_count,
            poster_path: mediaItem.poster_path,
            backdrop_path: mediaItem.backdrop_path,
          });
        }

        // Collect media IDs for reference
        mediaIds.push(media._id);
      }

      // Update or create `categoricalMedia` record
      await CategoricalMedia.findOneAndUpdate(
        { category: mediaCategory, media_type: mediaType }, // Match both category and media type
        { media_ids: mediaIds, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      console.log(`CategoricalMedia for "${mediaCategory}" (${mediaType}) updated successfully.`);
    }

    return successResponse(res, `${mediaCategory} ${mediaType} fetched successfully`, freshData);
  } catch (error) {
    console.error(`Error fetching ${mediaCategory} ${mediaType} from TMDB:`, error.message);

    // Fallback to `categoricalMedia` if TMDB fails
    try {
      const categoryRecord = await CategoricalMedia.findOne({
        category: mediaCategory,
        media_type: mediaType, // Match both category and media type
      }).populate('media_ids');

      if (!categoryRecord) {
        return errorResponse(res, `No fallback data available for ${mediaCategory} ${mediaType}`, 404);
      }

      return successResponse(
        res,
        `${mediaCategory} ${mediaType} fetched from fallback`,
        categoryRecord.media_ids
      );
    } catch (fallbackError) {
      console.error(`Error fetching fallback data for ${mediaCategory} ${mediaType}:`, fallbackError.message);
      return errorResponse(res, `Error fetching ${mediaCategory} ${mediaType}`, 500, fallbackError.message);
    }
  }
};

module.exports = fetchMediaCategory;
