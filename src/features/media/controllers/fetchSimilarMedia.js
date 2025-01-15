const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchSimilarMedia = async (req, res, next) => {
  const { mediaType, mediaId } = req.params;
  const page = req.query.page || 1;

  try {
    const similar = await api.get(`/${mediaType}/${mediaId}/similar`, {
      params: { page },
    });

    return successResponse(res, 'Similar media fetched successfully', similar.data.results);
  } catch (error) {
    console.error('Error fetching similar media:', error);
    return errorResponse(res, 'Error fetching similar media', 500, error.message);
  }
};

module.exports = fetchSimilarMedia;
