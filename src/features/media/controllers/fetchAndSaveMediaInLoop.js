const Media = require('@src/models/media');
const fetchMediaDetailsFromTMDB = require('@src/features/media/services/fetchMediaDetailsFromTMDB');
const { formatCredits, formatMediaData } = require('@src/features/media/helpers/mediaDetailsHelper');
const saveDataToDB = require('@src/features/media/services/saveDataToDB');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

// Adjustable delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Controller function to fetch and save media data in a loop
const fetchAndSaveMediaInLoop = async (req, res, next) => {
  const { mediaType, startId, endId, delayMs = 100 } = req.body;

  if (!mediaType || !startId || !endId || startId > endId) {
    return errorResponse(res, 'Invalid input. Ensure mediaType, startId, and endId are valid.', 400);
  }

  try {
    for (let id = startId; id <= endId; id++) {
      try {
        // Check if media already exists in the database
        const existingMedia = await Media.findOne({ tmdb_id: id, media_type: mediaType });
        if (existingMedia) {
          // console.log(`-----------------------------------------<  SKIPPING  >----- ${mediaType} with ID ${id} already exists in the database.`);
          console.log(`                                                                            < SKIPPING | ${mediaType} | ID: ${id} >---`);
          continue;
        }

        // Fetch media details from TMDB
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

        // Format the data
        const data = formatMediaData(mediaType, mediaDetails, trailerKey, credits, keywords);

        // Save data to the database
        await saveDataToDB(Media, { ...data, data_status: 'Complete' });
        // console.log(`---<  SUCCESSFUL   | ${mediaType} | ${id} >------------------------------------------ `);
        console.log(`---<  SUCCESSFUL | ${mediaType} | ID: ${id} >`);
                     
        // Delay between requests
        await delay(delayMs);
      } catch (error) {
        // console.error(`--------------------<  NOT FOUND  >----------------------- ${mediaType} with ID ${id}:`, error.message);
        console.error(`                                        X  NOT FOUND | ${mediaType} | ID: ${id} X`);
        // Continue with the next iteration even if one fails
        continue;
      }
    }
    return successResponse(res, `Media data fetched and saved from ID ${startId} to ${endId}.`);
  } catch (error) {
    console.error('Error during loop execution:', error.message);
    return errorResponse(res, 'Error during media fetch loop.', 500, error.message);
  }
};

module.exports = fetchAndSaveMediaInLoop
