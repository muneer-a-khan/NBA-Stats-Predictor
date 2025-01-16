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
});
