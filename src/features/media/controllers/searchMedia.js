const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const searchMedia = async (req, res, next) => {
  const searchQuery = req.query.query;
  const mediaType = req.query.mediaType; // New query parameter for media type
  const page = req.query.page || 1;

  if (!searchQuery) {
    return errorResponse(res, 'Query parameter is required.', 400);
  }

  try {
    // Determine the endpoint based on the mediaType
    let endpoint = '/search/multi'; // Default to multi search
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

    // Map results to include only the desired fields
    const results = response.data.results.map((item) => {
      let mediaType = item.media_type || ''; // Preserve media type if multi search
      if (endpoint === '/search/movie') mediaType = 'movie';
      if (endpoint === '/search/tv') mediaType = 'tv';

      return {
        id: item.id,
        mediaType,
        title: item.title || item.name,
        poster_path: item.poster_path || item.profile_path,
      };
    });

    return successResponse(res, 'Search completed successfully', results);
  } catch (error) {
    console.error('Error during search:', error);
    next(error);
  }
};

module.exports = searchMedia;
