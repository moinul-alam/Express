const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const fetchGenreList = async (req, res, next) => {
    const { mediaType } = req.params;
    const page = req.query.page || 1;

    try {
        const response = await api.get(`/genre/${mediaType}/list`, {
            params: { page },
        });

        return successResponse(res, 'Genre list fetched successfully', response.data);
    } catch (error) {
        console.error(`Error fetching ${mediaType} genre list:`, error);
        return errorResponse(res, `Error fetching ${mediaType} genre list`, 500, error.message);
    }
};

module.exports = fetchGenreList;
