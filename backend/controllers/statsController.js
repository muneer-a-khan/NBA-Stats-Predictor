const Player = require('../models/Player');
const { calculateTrends, calculateAverages } = require('../utils/calculateStats');

const getAdvancedStats = async (req, res) => {
    try {
        const { playerId } = req.params;
        const playerModel = new Player(req.db);
        const seasons = await playerModel.getPlayerSeasons(playerId);
        
        if (!seasons || seasons.length === 0) {
            return res.status(404).json({ error: 'No stats found for player' });
        }

        const advancedStats = seasons.map(season => ({
            season_id: season.season_id,
            efficiency: calculateEfficiency(season),
            true_shooting: calculateTrueShooting(season),
            per_minute: calculatePerMinute(season),
            win_shares: calculateWinShares(season)
        }));

        res.json({ advancedStats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getYearlyComparison = async (req, res) => {
    try {
        const { playerId, year1, year2 } = req.params;
        const playerModel = new Player(req.db);
        
        const [stats1, stats2] = await Promise.all([
            playerModel.getSeasonStats(playerId, year1),
            playerModel.getSeasonStats(playerId, year2)
        ]);

        if (!stats1 || !stats2) {
            return res.status(404).json({ error: 'Stats not found for one or both seasons' });
        }

        const comparison = compareSeasons(stats1, stats2);
        res.json({ comparison });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const predictNextSeason = async (req, res) => {
    try {
        const { playerId } = req.params;
        const playerModel = new Player(req.db);
        const seasons = await playerModel.getPlayerSeasons(playerId);
        
        if (!seasons || seasons.length === 0) {
            return res.status(404).json({ error: 'No stats found for player' });
        }

        const predictions = generatePredictions(seasons);
        res.json({ predictions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper functions
const calculateEfficiency = (stats) => {
    return (
        (stats.pts + stats.reb + stats.ast + stats.stl + stats.blk) -
        ((stats.fga - stats.fgm) + (stats.fta - stats.ftm) + stats.turnovers)
    );
};

const calculateTrueShooting = (stats) => {
    return stats.pts / (2 * (stats.fga + 0.44 * stats.fta)) * 100;
};

const calculatePerMinute = (stats) => {
    return {
        pts_per_min: stats.pts / stats.min,
        reb_per_min: stats.reb / stats.min,
        ast_per_min: stats.ast / stats.min
    };
};

const calculateWinShares = (stats) => {
    const leagueAveragePtsPerPoss = 1.1;
    const marginalOffense = stats.pts - (leagueAveragePtsPerPoss * stats.poss);
    return marginalOffense / 30;
};

const compareSeasons = (season1, season2) => {
    const keys = ['pts', 'ast', 'reb', 'stl', 'blk', 'fg_pct', 'fg3_pct', 'ft_pct'];
    const comparison = {};

    keys.forEach(key => {
        comparison[key] = {
            value1: season1[key],
            value2: season2[key],
            difference: season2[key] - season1[key],
            percentage_change: ((season2[key] - season1[key]) / season1[key]) * 100
        };
    });

    return comparison;
};

const generatePredictions = (seasons) => {
    const sortedSeasons = [...seasons].sort((a, b) => 
        parseInt(b.season_id) - parseInt(a.season_id)
    );

    const recentSeasons = sortedSeasons.slice(0, 3);
    const weights = [0.5, 0.3, 0.2];
    const stats = ['pts', 'ast', 'reb', 'stl', 'blk', 'fg_pct', 'fg3_pct', 'ft_pct'];
    
    const predictions = {};
    stats.forEach(stat => {
        const weightedSum = recentSeasons.reduce((sum, season, index) => {
            return sum + (season[stat] * (weights[index] || 0));
        }, 0);

        // Apply trend adjustment
        const trend = calculateTrend(recentSeasons, stat);
        predictions[stat] = weightedSum * (1 + trend);
    });

    return predictions;
};

const calculateTrend = (seasons, stat) => {
    if (seasons.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < seasons.length; i++) {
        const change = (seasons[i-1][stat] - seasons[i][stat]) / seasons[i][stat];
        changes.push(change);
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
};

module.exports = {
    getAdvancedStats,
    getYearlyComparison,
    predictNextSeason
};