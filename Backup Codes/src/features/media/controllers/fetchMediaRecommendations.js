const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchMediaRecommendations = async (req, res, next) => {
  const { mediaType, id } = req.params;
  const page = req.query.page || 1;

  try {
    const recommendations = await api.get(`/${mediaType}/${id}/recommendations`, {
      params: { page },
    });

    return successResponse(res, `${mediaType} recommendations fetched successfully`, recommendations.data.results);
  } catch (error) {
    console.error('Error fetching media recommendations:', error);
    return errorResponse(res, 'Error fetching media recommendations', 500, error.message);
  }
};

module.exports = fetchMediaRecommendations;
