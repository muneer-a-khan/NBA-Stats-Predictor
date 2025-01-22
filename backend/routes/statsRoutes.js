const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Advanced stats routes
router.get('/advanced/:playerId', statsController.getAdvancedStats);

// Year comparison routes
router.get('/compare/:playerId/:year1/:year2', statsController.getYearlyComparison);

// Prediction routes
router.get('/predict/:playerId', statsController.predictNextSeason);

module.exports = router;