const express = require('express');
const router = express.Router();

// Example data
const players = [
    { name: "Player 1", team: "Team A", position: "Forward" },
    { name: "Player 2", team: "Team B", position: "Guard" },
];

// Route to fetch players
router.get('/', (req, res) => {
    res.json(players); // Return an array of players
});

module.exports = router;
