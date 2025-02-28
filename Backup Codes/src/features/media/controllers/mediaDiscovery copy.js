const api = require('@src/utils/api');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const ALLOWED_MEDIA_TYPES = ['movie', 'tv'];

const VALID_FILTERS = {
    sort_by: 'string',
    with_genres: 'string',
    'release_date.gte': 'string',
    'release_date.lte': 'string',
    page: 'number',
    include_adult: 'boolean',
    language: 'string',
    primary_release_year: 'number',
    'vote_average.gte': 'number',
    'vote_average.lte': 'number',
    with_keywords: 'string',
    with_cast: 'string',
    with_crew: 'string',
    without_genres: 'string',
    with_runtime_gte: 'number',
    with_runtime_lte: 'number',
};

const validateMediaType = (mediaType) => {
    return ALLOWED_MEDIA_TYPES.includes(mediaType) ? null : `Invalid media type. Allowed types are: ${ALLOWED_MEDIA_TYPES.join(', ')}`;
};

const validateFilters = (filters) => {
    return Object.entries(filters).reduce((errors, [key, value]) => {
        const expectedType = VALID_FILTERS[key];

        if (!expectedType) {
            errors.push(`Invalid filter: ${key}`);
        } else if (expectedType === 'number' && (isNaN(value) || value < 1)) {
            errors.push(`Invalid value for ${key}: expected a positive number`);
        } else if (expectedType === 'boolean' && !(value === 'true' || value === 'false')) {
            errors.push(`Invalid value for ${key}: expected boolean`);
        } else if (expectedType === 'string' && typeof value !== 'string') {
            errors.push(`Invalid type for ${key}: expected string`);
        } else if ((key === 'release_date.gte' || key === 'release_date.lte') && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            errors.push(`Invalid date format for ${key}: expected YYYY-MM-DD`);
        }
        return errors;
    }, []);
};

const mediaDiscovery = async (req, res, next) => {
    const { mediaType } = req.params;
    let filters = { ...req.query };

    // Set default values if not provided
    if (!filters.primary_release_year) filters.primary_release_year = 2022;
    if (!filters.language) filters.language = 'en-US';
    if (!filters.sort_by) filters.sort_by = 'popularity.desc';

    // Validate media type
    const mediaTypeError = validateMediaType(mediaType);
    if (mediaTypeError) return errorResponse(res, mediaTypeError, 400);

    // Validate filters
    const filterErrors = validateFilters(filters);
    if (filterErrors.length) return errorResponse(res, 'Validation errors.', 400, filterErrors);

    try {
        const response = await api.get(`/discover/${mediaType}`, { params: { ...filters, page: filters.page || 1 } });
        return successResponse(res, 'Media discovered successfully', response.data.results);
    } catch (error) {
        console.error('Error fetching media discovery data:', error);
        next(error);
    }
};

module.exports = mediaDiscovery;
