const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchMediaCategory = async (req, res, next) => {
  const { mediaType, mediaCategory } = req.params;
  const page = req.query.page || 1;

  let endpoint = `/${mediaType}/${mediaCategory}`;

  if (mediaCategory === 'trending') {
    const timeWindow = req.query.timeWindow || 'day';
    endpoint = `/trending/${mediaType}/${timeWindow}`;
  }

  try {
    const response = await api.get(endpoint, { params: { page } });

    return successResponse(res, `${mediaCategory} ${mediaType} fetched successfully`, response.data.results);
  } catch (error) {
    console.error(`Error fetching ${mediaCategory} ${mediaType}:`, error);
    return errorResponse(res, `Error fetching ${mediaCategory} ${mediaType}`, 500, error.message);
  }
};

module.exports = fetchMediaCategory;
