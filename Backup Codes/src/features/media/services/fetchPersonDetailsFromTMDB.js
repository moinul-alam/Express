const api = require('@src/utils/api');

const fetchPersonDetailsFromTMDB = async (person_id) => {
  const [detailsResponse, movieCreditsResponse, tvCreditsResponse] = await Promise.all([
    api.get(`/person/${person_id}`),
    api.get(`/person/${person_id}/movie_credits`),
    api.get(`/person/${person_id}/tv_credits`),
  ]);

  return {
    personDetails: detailsResponse.data,
    movieCredits: movieCreditsResponse.data,
    tvCredits: tvCreditsResponse.data,
  };
};

module.exports = fetchPersonDetailsFromTMDB;
