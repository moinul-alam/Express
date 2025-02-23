const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const searchMedia = async (req, res, next) => {
  const searchQuery = req.query.query;
  const page = req.query.page || 1;

  if (!searchQuery) {
    return errorResponse(res, 'Query parameter is required.', 400);
  }

  try {
    const response = await api.get('/search/multi', {
      params: {
        query: searchQuery,
        page: page,
      },
    });

    // Map results to include only the desired fields
    const combinedResults = response.data.results.map((item) => {
      let mediaType = '';

      if (item.media_type === 'movie') {
        mediaType = 'movie';
      } else if (item.media_type === 'tv') {
        mediaType = 'tv';
      } else if (item.media_type === 'person') {
        mediaType = 'person'; 
      } else {
        mediaType = 'other'; 
      }

      return {
        id: item.id,
        mediaType: item.media_type,
        title: item.title || item.name || '',
        overview: item.overview || '',
        poster_path: item.poster_path,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average || 0
      };
    });

    return successResponse(res, 'Search completed successfully', combinedResults);
  } catch (error) {
    console.error('Error during search:', error);
    next(error);
  }
};

module.exports = searchMedia;
