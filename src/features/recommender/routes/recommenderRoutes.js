const express = require('express');

const fetchSimilarRecommendations = require('@src/features/recommender/controllers/fetchSimilarRecommendations');

const router = express.Router();

router.get('/:mediaType/:mediaId/similar', fetchSimilarRecommendations);


module.exports = router;