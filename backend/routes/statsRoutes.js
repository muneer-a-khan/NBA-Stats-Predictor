const express = require('express');
const router = express.Router();

// Define stats-related endpoints
router.get('/', (req, res) => {
    res.json({ message: 'Stats routes are working!' });
});

module.exports = router;
