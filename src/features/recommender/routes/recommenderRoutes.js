const express = require('express');

const getMetadata = require('@src/features/recommender/helpers/getMetadata');

const recommenderCollabUser = require('@src/features/recommender/controllers/recommenderCollabUser');
const recommenderCollabItem = require('@src/features/recommender/controllers/recommenderCollabItem');

const recommenderContentSimilar = require('@src/features/recommender/controllers/recommenderContentSimilar');
const recommenderContentDiscover = require('@src/features/recommender/controllers/recommenderContentDiscover');

const recommenderHybrid = require('@src/features/recommender/controllers/recommenderHybrid');
const recommenderHybridWeighted = require('@src/features/recommender/controllers/recommenderHybridWeighted');
const recommenderHybridSwitching = require('@src/features/recommender/controllers/recommenderHybridSwitching');



const router = express.Router();

router.post('/content-based/get-metadata', getMetadata);

router.post('/collaborative/user-based-recommendations', recommenderCollabUser);
router.post('/collaborative/item-based-recommendations', recommenderCollabItem);

router.post('/content-based/similar-items', recommenderContentSimilar);
router.post('/content-based/discover', recommenderContentDiscover);

router.post('/hybrid', recommenderHybrid);
router.post('/hybrid/weighted', recommenderHybridWeighted);
router.post('/hybrid/switching', recommenderHybridSwitching);


module.exports = router;