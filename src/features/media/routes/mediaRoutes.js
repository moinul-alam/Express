const express = require('express');

const { 
  fetchAndSaveMediaInLoop,
  searchAll, searchMedia, fetchMediaCategory,
  fetchMediaDetails, fetchSimilarMedia, fetchMediaRecommendations,
  fetchPersonDetails, mediaDiscovery, fetchGenreList
} = require('@src/features/media/controllers');

const router = express.Router();

router.post('/fetchAndSaveMedia', fetchAndSaveMediaInLoop);

router.get('/searchAll', searchAll);
router.get('/searchMedia', searchMedia);

router.get('/category/:mediaType/:mediaCategory', fetchMediaCategory);

router.get('/discover/:mediaType', mediaDiscovery);
router.get('/person/bio/:person_id', fetchPersonDetails);
router.get('/genre/:mediaType/list', fetchGenreList);

router.get('/:mediaType/:id', fetchMediaDetails);
router.get('/:mediaType/:mediaId/similar', fetchSimilarMedia);
router.get('/recommendations/:mediaType/:id', fetchMediaRecommendations);


module.exports = router;