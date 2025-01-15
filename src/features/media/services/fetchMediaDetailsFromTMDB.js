const api = require('@src/utils/api');

const fetchMediaDetailsFromTMDB = async (mediaType, id) => {
  const [mediaDetails, trailerDetails, creditDetails] = await Promise.all([
    api.get(`/${mediaType}/${id}`),
    api.get(`/${mediaType}/${id}/videos`),
    api.get(`/${mediaType}/${id}/credits`),
  ]);

  return { mediaDetails, trailerDetails, creditDetails };
};

module.exports = fetchMediaDetailsFromTMDB ;
