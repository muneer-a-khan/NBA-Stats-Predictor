const express = require('express');
const router = express.Router();

const players = [
    { name: "LeBron James", team: "Lakers", position: "Forward", points: 27.2, assists: 7.4, games: 82 },
    { name: "Kevin Durant", team: "Suns", position: "Forward", points: 29.6, assists: 5.2, games: 75 },
    { name: "Stephen Curry", team: "Warriors", position: "Guard", points: 30.1, assists: 6.3, games: 78 },
];

router.get('/', (req, res) => {
    res.json(players);
});

module.exports = router;
