const express = require('express');

const getMetadata = require('@src/features/recommender/helpers/getMetadata');

const recommenderCollabUser = require('@src/features/recommender/controllers/recommenderCollabUser');
const recommenderCollabItem = require('@src/features/recommender/controllers/recommenderCollabItem');

const recommenderContentSimilar = require('@src/features/recommender/controllers/recommenderContentSimilar');
const recommenderContentDiscover = require('@src/features/recommender/controllers/recommenderContentDiscover');

const recommenderHybrid = require('@src/features/recommender/controllers/recommenderHybrid');
const recommenderHybridWeighed = require('@src/features/recommender/controllers/recommenderHybridWeighed');



const router = express.Router();

router.post('/content-based/get-metadata', getMetadata);

router.post('/collaborative/user-based-recommendations', recommenderCollabUser);
router.post('/collaborative/item-based-recommendations', recommenderCollabItem);

router.get('/content-based/:mediaType/:mediaId/similar', recommenderContentSimilar);
router.post('/content-based/discover', recommenderContentDiscover);

router.post('/hybrid', recommenderHybrid);
router.post('/hybrid/weighed', recommenderHybridWeighed);


module.exports = router;