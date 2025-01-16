const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

router.get('/nba-player-stats', (req, res) => {
    const playerName = req.query.name;

    if (!playerName) {
        return res.status(400).json({ error: 'Player name is required' });
    }

    exec(`"C:/Python313/python.exe" fetch_nba_stats.py "${playerName}"`, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution Error: ${error.message}`);
            return res.status(500).json({ error: `Execution Error: ${error.message}` });
        }

        if (stderr) {
            console.error(`Python Script Error (stderr): ${stderr}`);
            return res.status(500).json({ error: `Python Script Error: ${stderr}` });
        }

        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (parseError) {
            console.error(`JSON Parse Error: ${parseError.message}`);
            res.status(500).json({ error: 'Failed to parse player stats output.' });
        }
    });
});

module.exports = router;
