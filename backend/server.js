const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const playerRoutes = require('./routes/playerRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/players', playerRoutes);

// Load all players in the background
exec('python ./routes/fetch_nba_stats.py all', (error, stdout, stderr) => {
    if (error) {
        console.error('Failed to load players in background:', error.message);
    } else {
        console.log('Background player load completed:', stdout);
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
