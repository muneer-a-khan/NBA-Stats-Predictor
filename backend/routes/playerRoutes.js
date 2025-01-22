const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

let allPlayers = []; // Cache for all players

// Load all players
router.get('/load-all', (req, res) => {
    exec('python fetch_nba_stats.py "all"', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution Error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to fetch all player stats.' });
        }

        if (stderr) {
            console.error(`Python Script Error: ${stderr}`);
            return res.status(500).json({ error: `Python Script Error: ${stderr}` });
        }

        try {
            const data = JSON.parse(stdout);
            allPlayers = data; // Cache all players
            res.json({ message: 'All players loaded successfully.' });
        } catch (parseError) {
            console.error(`JSON Parse Error: ${parseError.message}`);
            res.status(500).json({ error: 'Failed to parse all player stats output.' });
        }
    });
});

// Fetch 10 random players
router.get('/random-players', (req, res) => {
    if (!allPlayers || allPlayers.length === 0) {
        return res.status(500).json({ error: 'All players not loaded yet.' });
    }

    const randomPlayers = allPlayers.sort(() => 0.5 - Math.random()).slice(0, 10);
    res.json(randomPlayers);
});

module.exports = router;
