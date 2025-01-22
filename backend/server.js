const express = require('express');
const cors = require('cors');
const playerRoutes = require('./routes/playerRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/players', playerRoutes);
app.use('/api/stats', statsRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Call /players/load-all on startup
    const fetch = require('node-fetch');
    fetch('http://localhost:5000/api/players/load-all')
        .then((res) => res.json())
        .then((data) => console.log('All players loaded:', data.message))
        .catch((err) => console.error('Failed to load players on startup:', err));
});
