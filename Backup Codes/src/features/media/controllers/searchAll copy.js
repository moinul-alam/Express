const api = require('@src/utils/api');
const Media = require('@src/models/media');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const searchMedia = async (req, res, next) => {
  const searchQuery = req.query.query;
  const page = parseInt(req.query.page) || 1;

  if (!searchQuery) {
    return errorResponse(res, 'Query parameter is required.', 400);
  }

  try {
    const response = await api.get('/search/multi', {
      params: { query: searchQuery, page: page },
    });

    // Extract required fields
    const combinedResults = response.data.results.map((item) => ({
      id: item.id,
      mediaType: item.media_type,
      title: item.title || item.name || '',
      overview: item.overview || '',
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average || 0,
    }));

    return successResponse(res, 'Search completed successfully', combinedResults);
  } catch (error) {
    console.error('TMDB API failed, attempting database search:', error);

    try {
      // Perform a case-insensitive search in MongoDB
      const dbResults = await Media.find(
        { title: { $regex: new RegExp(searchQuery, 'i') } },
        { _id: 0, __v: 0 } // Exclude MongoDB-specific fields
      ).limit(20);

      return successResponse(res, 'Search completed using database', dbResults);
    } catch (dbError) {
      console.error('Database search failed:', dbError);
      return errorResponse(res, 'Search failed due to an internal error.', 500);
    }
  }
};

module.exports = searchMedia;
