const api = require('@src/utils/api');

const fetchMediaDetailsFromTMDB = async (mediaType, id) => {
  const [mediaDetails, trailerDetails, creditDetails, keywordDetails] = await Promise.all([
    api.get(`/${mediaType}/${id}`),
    api.get(`/${mediaType}/${id}/videos`),
    api.get(`/${mediaType}/${id}/credits`),
    api.get(`/${mediaType}/${id}/keywords`),
  ]);

  return { mediaDetails, trailerDetails, creditDetails, keywordDetails };
};

module.exports = fetchMediaDetailsFromTMDB;
