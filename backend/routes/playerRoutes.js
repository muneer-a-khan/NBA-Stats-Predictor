const express = require('express');
const router = express.Router();

// Define player-related endpoints
router.get('/', (req, res) => {
    res.json({ message: 'Player routes are working!' });
});

module.exports = router;
