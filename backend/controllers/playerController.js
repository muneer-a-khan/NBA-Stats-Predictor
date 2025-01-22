const Player = require('../models/Player');
const { calculateTrends, calculateCareerHighs } = require('../utils/calculateStats');

const getRandomPlayers = async (req, res) => {
    try {
        const playerModel = new Player(req.db);
        const players = await playerModel.getRandomPlayers(10);
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchPlayer = async (req, res) => {
    try {
        const { name } = req.query;
        const playerModel = new Player(req.db);
        const player = await playerModel.findByName(name);

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Get all seasons for the player
        const seasons = await playerModel.getPlayerSeasons(player.id);
        
        // Calculate career trends
        const trends = calculateTrends(seasons);
        
        // Get career highs
        const careerHighs = calculateCareerHighs(seasons);

        res.json({
            player: {
                ...player,
                seasons,
                trends,
                careerHighs
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPlayerSeasonStats = async (req, res) => {
    try {
        const { playerId, seasonId } = req.params;
        const playerModel = new Player(req.db);
        
        const stats = await playerModel.getSeasonStats(playerId, seasonId);
        if (!stats) {
            return res.status(404).json({ error: 'Stats not found for the specified season' });
        }
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPlayerTrends = async (req, res) => {
    try {
        const { playerId } = req.params;
        const playerModel = new Player(req.db);
        
        const seasons = await playerModel.getPlayerSeasons(playerId);
        const trends = calculateTrends(seasons);
        
        res.json({ trends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePlayerStats = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { stats } = req.body;
        const playerModel = new Player(req.db);
        
        await playerModel.updatePlayerStats(playerId, stats);
        
        res.json({ message: 'Stats updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addSeasonStats = async (req, res) => {
    try {
        const { stats } = req.body;
        const playerModel = new Player(req.db);
        
        await playerModel.addSeasonStats(stats);
        
        res.json({ message: 'Season stats added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getRandomPlayers,
    searchPlayer,
    getPlayerSeasonStats,
    getPlayerTrends,
    updatePlayerStats,
    addSeasonStats
};