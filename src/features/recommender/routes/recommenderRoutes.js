const express = require('express');

const recommendSimilarMedia = require('@src/features/recommender/controllers/recommendSimilarMedia');
const discoverSimilarMedia = require('@src/features/recommender/controllers/discoverSimilarMedia');

const router = express.Router();

router.get('/:mediaType/:mediaId/similar', recommendSimilarMedia);
router.post('/discover', discoverSimilarMedia);


module.exports = router;