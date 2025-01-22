const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const playerRoutes = require('./routes/playerRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { initializeDB } = require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Add logging
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
(async () => {
    try {
        const db = await initializeDB();
        console.log('Database initialized successfully');

        // Pass db instance to routes
        app.use((req, res, next) => {
            req.db = db;
            next();
        });

        // Routes
        app.use('/api/players', playerRoutes);
        app.use('/api/stats', statsRoutes);

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });

        // Start server
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
})();