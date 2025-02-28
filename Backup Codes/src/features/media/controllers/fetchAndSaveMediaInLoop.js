const Media = require('@src/models/media');
const fetchMediaDetailsFromTMDB = require('@src/features/media/services/fetchMediaDetailsFromTMDB');
const { formatCredits, formatMediaData } = require('@src/features/media/helpers/mediaDetailsHelper');
const saveDataToDB = require('@src/features/media/services/saveDataToDB');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

// Adjustable delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Controller function to fetch and save media data in batches
const fetchAndSaveMediaInLoop = async (req, res, next) => {
  const { mediaType, startId, endId, batchSize = 5, delayMs = 500 } = req.body;

  if (!mediaType || !startId || !endId || startId > endId) {
    return errorResponse(res, 'Invalid input. Ensure mediaType, startId, and endId are valid.', 400);
  }

  try {
    for (let id = startId; id <= endId; id += batchSize) {
      const batchPromises = [];

      for (let batchId = id; batchId < id + batchSize && batchId <= endId; batchId++) {
        batchPromises.push(fetchAndSaveMedia(mediaType, batchId));
      }

      // Execute all requests in parallel
      await Promise.all(batchPromises);

      // Delay before next batch
      await delay(delayMs);
    }

    return successResponse(res, `Media data fetched and saved from ID ${startId} to ${endId}.`);
  } catch (error) {
    console.error('Error during batch execution:', error.message);
    return errorResponse(res, 'Error during media fetch loop.', 500, error.message);
  }
};

// Helper function to fetch and save a single media item
const fetchAndSaveMedia = async (mediaType, id) => {
  try {
    const existingMedia = await Media.findOne({ tmdb_id: id, media_type: mediaType });
    if (existingMedia) {
      console.log(`- | ${mediaType} | ID: ${id}                 | SKIPPING | -`);
      return;
    }

    const { mediaDetails, trailerDetails, creditDetails, keywordDetails } =
      await fetchMediaDetailsFromTMDB(mediaType, id);

    const officialTrailer = trailerDetails.data.results.find(
      (video) => video.type === 'Trailer' && video.official === true
    );
    const trailerKey = officialTrailer ? officialTrailer.key : null;

    const credits = formatCredits(mediaType, creditDetails, mediaDetails);
    const keywords = (mediaType === 'movie' 
      ? keywordDetails.data.keywords 
      : keywordDetails.data.results
    ).map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    }));

    const data = formatMediaData(mediaType, mediaDetails, trailerKey, credits, keywords);
    await saveDataToDB(Media, { ...data, data_status: 'Complete' });

    console.log(`+ | ${mediaType} | ID: ${id} | SUCCESSFUL |`);
  } catch (error) {
    console.error(`  | ${mediaType} | ID: ${id}                               X| NOT FOUND |X`);
  }
};

module.exports = fetchAndSaveMediaInLoop;
