const express = require('express');
const router = express.Router();

router.post('/predict', (req, res) => {
    const { playerName } = req.body;

    // Example static prediction logic
    const prediction = {
        playerName: playerName || 'Unknown Player',
        predictedPoints: 25.0, // Static value for now
        predictedAssists: 7.5,
        predictedGames: 80,
    };

    res.json(prediction);
});

module.exports = router;
