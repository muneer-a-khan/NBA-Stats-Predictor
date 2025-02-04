const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'nba_stats.db');

const getDb = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) {
                console.error('Database connection error:', err);
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
};

const calculateCareerAverages = (seasons) => {
    if (!seasons || seasons.length === 0) return null;
    
    const totalGames = seasons.reduce((sum, season) => sum + (season.games || 0), 0);
    
    return {
        career_ppg: seasons.reduce((sum, season) => sum + (season.pts_per_game || 0) * (season.games || 0), 0) / totalGames,
        career_apg: seasons.reduce((sum, season) => sum + (season.ast_per_game || 0) * (season.games || 0), 0) / totalGames,
        career_rpg: seasons.reduce((sum, season) => sum + (season.reb_per_game || 0) * (season.games || 0), 0) / totalGames,
        career_spg: seasons.reduce((sum, season) => sum + (season.stl_per_game || 0) * (season.games || 0), 0) / totalGames,
        career_bpg: seasons.reduce((sum, season) => sum + (season.blk_per_game || 0) * (season.games || 0), 0) / totalGames,
        career_fg_pct: seasons.reduce((sum, season) => sum + (season.fg_percent || 0) * (season.games || 0), 0) / totalGames,
        career_fg3_pct: seasons.reduce((sum, season) => sum + (season.fg3_percent || 0) * (season.games || 0), 0) / totalGames,
        career_ft_pct: seasons.reduce((sum, season) => sum + (season.ft_percent || 0) * (season.games || 0), 0) / totalGames
    };
};

// Test endpoint
router.get('/test', async (req, res) => {
    try {
        const db = await getDb();
        db.get('SELECT COUNT(*) as count FROM players', (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                message: 'Database connection successful', 
                playerCount: row.count 
            });
            db.close();
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get random players
// Modify the random-players endpoint
router.get('/random-players', async (req, res) => {
    try {
        const db = await getDb();
        db.all(`
            SELECT p.*, 
                json_group_array(
                    json_object(
                        'season_id', s.season_id,
                        'season', s.season,
                        'team', s.team,
                        'games', COALESCE(s.games, 0),
                        'minutes_per_game', COALESCE(s.minutes_per_game, 0),
                        'pts_per_game', COALESCE(s.pts_per_game, 0),
                        'ast_per_game', COALESCE(s.ast_per_game, 0),
                        'reb_per_game', COALESCE(s.reb_per_game, 0),
                        'stl_per_game', COALESCE(s.stl_per_game, 0),
                        'blk_per_game', COALESCE(s.blk_per_game, 0),
                        'fg_percent', COALESCE(s.fg_percent, 0),
                        'fg3_percent', COALESCE(s.fg3_percent, 0),
                        'ft_percent', COALESCE(s.ft_percent, 0),
                        'turnover_per_game', COALESCE(s.turnover_per_game, 0)
                    )
                ) as seasons_json
            FROM players p
            LEFT JOIN seasons s ON p.id = s.player_id
            GROUP BY p.id
            ORDER BY RANDOM()
            LIMIT 10
        `, [], (err, players) => {
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            const formattedPlayers = players.map(player => {
                try {
                    const seasons = JSON.parse(player.seasons_json || '[]');
                    return {
                        id: player.id,
                        full_name: player.full_name,
                        team: player.team,
                        position: player.position,
                        stats: JSON.parse(player.stats || '{}'),
                        // Only include career averages for random players
                        career_averages: calculateCareerAverages(seasons)
                    };
                } catch (e) {
                    console.error('Error parsing player data:', e);
                    return null;
                }
            }).filter(Boolean);
            
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

        // Exact match query
        const exactQuery = `
            SELECT p.*, 
                json_group_array(
                    json_object(
                        'season_id', s.season_id,
                        'season', s.season,
                        'team', s.team,
                        'games', COALESCE(s.games, 0),
                        'minutes_per_game', COALESCE(s.minutes_per_game, 0),
                        'pts_per_game', COALESCE(s.pts_per_game, 0),
                        'ast_per_game', COALESCE(s.ast_per_game, 0),
                        'reb_per_game', COALESCE(s.reb_per_game, 0),
                        'stl_per_game', COALESCE(s.stl_per_game, 0),
                        'blk_per_game', COALESCE(s.blk_per_game, 0),
                        'fg_percent', COALESCE(s.fg_percent, 0),
                        'fg3_percent', COALESCE(s.fg3_percent, 0),
                        'ft_percent', COALESCE(s.ft_percent, 0),
                        'turnover_per_game', COALESCE(s.turnover_per_game, 0)
                    )
                ) as seasons_json
            FROM players p
            LEFT JOIN seasons s ON p.id = s.player_id
            WHERE LOWER(p.full_name) = LOWER(?)
            GROUP BY p.id`;

        db.get(exactQuery, [name], (err, exactMatch) => {
            if (err) {
                console.error("Database error:", err);
                res.status(500).json({ error: err.message });
                return;
            }

            if (exactMatch) {
                try {
                    const seasons = JSON.parse(exactMatch.seasons_json || '[]');
                    const formattedPlayer = {
                        id: exactMatch.id,
                        full_name: exactMatch.full_name,
                        team: exactMatch.team,
                        position: exactMatch.position,
                        stats: JSON.parse(exactMatch.stats || '{}'),
                        seasons: seasons,
                        career_averages: calculateCareerAverages(seasons)
                    };
                    res.json({ player: formattedPlayer });
                } catch (e) {
                    console.error('Error parsing player data:', e);
                    res.status(500).json({ error: 'Error processing player data' });
                }
                return;
            }

            // If no exact match, try partial match
            const partialQuery = `
                SELECT p.*, 
                    json_group_array(
                        json_object(
                            'season_id', s.season_id,
                            'season', s.season,
                            'team', s.team,
                            'games', COALESCE(s.games, 0),
                            'minutes_per_game', COALESCE(s.minutes_per_game, 0),
                            'pts_per_game', COALESCE(s.pts_per_game, 0),
                            'ast_per_game', COALESCE(s.ast_per_game, 0),
                            'reb_per_game', COALESCE(s.reb_per_game, 0),
                            'stl_per_game', COALESCE(s.stl_per_game, 0),
                            'blk_per_game', COALESCE(s.blk_per_game, 0),
                            'fg_percent', COALESCE(s.fg_percent, 0),
                            'fg3_percent', COALESCE(s.fg3_percent, 0),
                            'ft_percent', COALESCE(s.ft_percent, 0),
                            'turnover_per_game', COALESCE(s.turnover_per_game, 0)
                        )
                    ) as seasons_json
                FROM players p
                LEFT JOIN seasons s ON p.id = s.player_id
                WHERE LOWER(p.full_name) LIKE LOWER(?)
                GROUP BY p.id
                LIMIT 10`;

            db.all(partialQuery, [`%${name}%`], (err, players) => {
                if (err) {
                    console.error("Database error:", err);
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!players || players.length === 0) {
                    res.status(404).json({ error: 'No players found' });
                    return;
                }

                try {
                    const formattedPlayers = players.map(player => ({
                        id: player.id,
                        full_name: player.full_name,
                        team: player.team,
                        position: player.position,
                        stats: JSON.parse(player.stats || '{}'),
                        seasons: JSON.parse(player.seasons_json || '[]'),
                        career_averages: calculateCareerAverages(JSON.parse(player.seasons_json || '[]'))
                    }));
                    res.json({ players: formattedPlayers });
                } catch (e) {
                    console.error('Error parsing players data:', e);
                    res.status(500).json({ error: 'Error processing players data' });
                }
            });
        });
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;