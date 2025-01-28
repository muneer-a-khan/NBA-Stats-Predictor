const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'nba_stats.db');

const getDb = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
};

// Calculate career averages
const calculateCareerAverages = (seasons) => {
    if (!seasons || seasons.length === 0) return null;
    
    const validSeasons = seasons.filter(s => s.games > 0);
    if (validSeasons.length === 0) return null;

    return {
        ppg: validSeasons.reduce((sum, s) => sum + s.pts_per_game, 0) / validSeasons.length,
        apg: validSeasons.reduce((sum, s) => sum + s.ast_per_game, 0) / validSeasons.length,
        rpg: validSeasons.reduce((sum, s) => sum + s.reb_per_game, 0) / validSeasons.length,
        spg: validSeasons.reduce((sum, s) => sum + s.stl_per_game, 0) / validSeasons.length,
        bpg: validSeasons.reduce((sum, s) => sum + s.blk_per_game, 0) / validSeasons.length,
        fgPercent: validSeasons.reduce((sum, s) => sum + s.fg_percent, 0) / validSeasons.length,
        fg3Percent: validSeasons.reduce((sum, s) => sum + s.fg3_percent, 0) / validSeasons.length,
        ftPercent: validSeasons.reduce((sum, s) => sum + s.ft_percent, 0) / validSeasons.length,
        gamesPlayed: validSeasons.reduce((sum, s) => sum + s.games, 0),
    };
};

// Get random players
router.get('/random-players', async (req, res) => {
    try {
        const db = await getDb();
        const query = `
        SELECT 
            p.*,
            GROUP_CONCAT(json_object(
                'season_id', s.season_id,  -- Changed from s.season
                'team', s.team,
                'games', s.games,
                'games_started', s.games_started,
                'minutes_per_game', s.minutes_per_game,
                'pts_per_game', s.pts_per_game,
                'ast_per_game', s.ast_per_game,
                'reb_per_game', s.reb_per_game,
                'stl_per_game', s.stl_per_game,
                'blk_per_game', s.blk_per_game,
                'fg_percent', s.fg_percent,
                'fg3_percent', s.fg3_percent,
                'ft_percent', s.ft_percent,
                'turnover_per_game', s.turnover_per_game
            )) as seasons_json
        FROM players p
        LEFT JOIN seasons s ON p.id = s.player_id
        GROUP BY p.id
        ORDER BY RANDOM()
        LIMIT 10;
        `;

        db.all(query, [], (err, players) => {
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            const formattedPlayers = players.map(player => {
                const seasons = player.seasons_json ? 
                    player.seasons_json.split(',').map(s => JSON.parse(s)) : [];
                
                const careerAverages = calculateCareerAverages(seasons);
                
                return {
                    id: player.id,
                    full_name: player.full_name,
                    team: player.team,
                    position: player.position,
                    birth_year: player.birth_year,
                    stats: JSON.parse(player.stats),
                    seasons: seasons,
                    career_averages: careerAverages
                };
            });
            
            res.json(formattedPlayers);
            db.close();
        });
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Search player
router.get('/players', async (req, res) => {
    try {
        const db = await getDb();
        const name = req.query.name;
        
        if (!name) {
            res.status(400).json({ error: 'Player name is required' });
            return;
        }

        const query = `
            SELECT 
                p.*,
                GROUP_CONCAT(json_object(
                    'season_id', s.season,
                    'team', s.team,
                    'games', s.games,
                    'games_started', s.games_started,
                    'minutes_per_game', s.minutes_per_game,
                    'pts_per_game', s.pts_per_game,
                    'ast_per_game', s.ast_per_game,
                    'reb_per_game', s.reb_per_game,
                    'stl_per_game', s.stl_per_game,
                    'blk_per_game', s.blk_per_game,
                    'fg_percent', s.fg_percent,
                    'fg3_percent', s.fg3_percent,
                    'ft_percent', s.ft_percent,
                    'turnover_per_game', s.turnover_per_game
                )) as seasons_json
            FROM players p
            LEFT JOIN seasons s ON p.id = s.player_id
            WHERE p.full_name LIKE ?
            GROUP BY p.id;
        `;

        db.get(query, [`%${name}%`], (err, player) => {
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (!player) {
                res.status(404).json({ error: 'Player not found' });
                return;
            }

            const seasons = player.seasons_json ? 
                player.seasons_json.split(',').map(s => JSON.parse(s)) : [];
            
            const careerAverages = calculateCareerAverages(seasons);

            const formattedPlayer = {
                player: {
                    id: player.id,
                    full_name: player.full_name,
                    team: player.team,
                    position: player.position,
                    birth_year: player.birth_year,
                    stats: JSON.parse(player.stats),
                    seasons: seasons,
                    career_averages: careerAverages
                }
            };
            
            res.json(formattedPlayer);
            db.close();
        });
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;