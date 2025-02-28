const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const searchMovieOrTv = async (req, res, next) => {
  const searchQuery = req.query.query;
  const mediaType = req.query.mediaType; // Accept "movie" or "tv" explicitly
  const page = req.query.page || 1;

  if (!searchQuery) {
    return errorResponse(res, 'Query parameter is required.', 400);
  }

  if (mediaType && mediaType !== 'movie' && mediaType !== 'tv') {
    return errorResponse(res, 'Invalid media type. Please use "movie" or "tv".', 400);
  }

  try {
    // Decide the endpoint based on `mediaType`
    let endpoint = '/search/multi';
    if (mediaType === 'movie') {
      endpoint = '/search/movie';
    } else if (mediaType === 'tv') {
      endpoint = '/search/tv';
    }

    const response = await api.get(endpoint, {
      params: {
        query: searchQuery,
        page: page,
      },
    });

    // Filter results: Include only `movie` or `tv` if using `/search/multi`
    const results = response.data.results.filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    );

    // Map results to include only desired fields
    const formattedResults = results.map((item) => ({
      id: item.id,
      mediaType: item.media_type,
      title: item.title || item.name || '',
      overview: item.overview || '',
      poster_path: item.poster_path,
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average || 0,
    }));

    return successResponse(res, 'Search completed successfully', formattedResults);
  } catch (error) {
    console.error('Error during search:', error);
    return errorResponse(res, 'Error during search', 500, error.message);
  }
};

module.exports = searchMovieOrTv;
