const express = require('express');

const recommendSimilarMedia = require('@src/features/recommender/controllers/recommendSimilarMedia');

const router = express.Router();

router.get('/:mediaType/:mediaId/similar', recommendSimilarMedia);


module.exports = router;