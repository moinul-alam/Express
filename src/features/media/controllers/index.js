const fetchMediaCategory = require ('@src/features/media/controllers/fetchMediaCategory');
const fetchMediaDetails = require ('@src/features/media/controllers/fetchMediaDetails');
const fetchPersonDetails = require ('@src/features/media/controllers/fetchPersonDetails');

const fetchGenreList = require ('@src/features/media/controllers/fetchGenreList');
const fetchSimilarMedia = require ('@src/features/media/controllers/fetchSimilarMedia');
const fetchMediaRecommendations = require ('@src/features/media/controllers/fetchMediaRecommendations');

const searchAll = require ('@src/features/media/controllers/searchAll');
const searchMedia = require ('@src/features/media/controllers/searchMedia');
const mediaDiscovery = require ('@src/features/media/controllers/mediaDiscovery');

module.exports = {
  fetchMediaCategory, fetchMediaDetails, fetchPersonDetails,
  fetchGenreList, fetchSimilarMedia, fetchMediaRecommendations,
  searchAll, searchMedia, mediaDiscovery
}