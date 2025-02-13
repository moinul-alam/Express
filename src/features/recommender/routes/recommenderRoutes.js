const express = require('express');

const recommendCollaborativeMedia = require('@src/features/recommender/controllers/recommendCollaborativeMedia');
const recommendSimilarMedia = require('@src/features/recommender/controllers/recommendSimilarMedia');
const discoverSimilarMedia = require('@src/features/recommender/controllers/discoverSimilarMedia');

const router = express.Router();

router.post('/collaborative/recommendations', recommendCollaborativeMedia);
router.get('/:mediaType/:mediaId/similar', recommendSimilarMedia);
router.post('/discover', discoverSimilarMedia);


module.exports = router;