const express = require('express');
const cors = require('cors');
const playerRoutes = require('./routes/playerRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', playerRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});