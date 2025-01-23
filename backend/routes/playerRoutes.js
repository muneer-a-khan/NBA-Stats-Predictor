const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const NBA = require('nba');
const { statsUpdaterMiddleware } = require('../utils/realTimeUpdates');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Apply stats updater middleware
router.use(statsUpdaterMiddleware);

// Database utilities
const columnExists = async (db, tableName, columnName) => {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const exists = rows.some(row => row.name === columnName);
            resolve(exists);
        });
    });
};

const migrateDatabase = async (db) => {
    try {
        const hasLastUpdated = await columnExists(db, 'players', 'last_updated');
        
        if (!hasLastUpdated) {
            console.log('Adding last_updated column to players table...');
            await new Promise((resolve, reject) => {
                db.run(`ALTER TABLE players ADD COLUMN last_updated DATETIME`, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('Successfully added last_updated column');
                    resolve();
                });
            });

            await new Promise((resolve, reject) => {
                db.run(`UPDATE players SET last_updated = datetime('now', '-2 days') WHERE last_updated IS NULL`, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('Successfully initialized last_updated values');
                    resolve();
                });
            });
        }
    } catch (error) {
        console.error('Error during database migration:', error);
        throw error;
    }
};

const initDatabase = async () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('nba_stats.db', async (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            try {
                await new Promise((resolve, reject) => {
                    db.run(`CREATE TABLE IF NOT EXISTS players (
                        id INTEGER PRIMARY KEY,
                        full_name TEXT,
                        team TEXT,
                        position TEXT,
                        jersey_number TEXT,
                        stats TEXT
                    )`, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                await migrateDatabase(db);
                resolve(db);
            } catch (error) {
                reject(error);
            }
        });
    });
};

// Routes
router.get('/random-players', async (req, res) => {
    try {
        const db = await initDatabase();
        db.all(`
            SELECT * FROM players 
            ORDER BY RANDOM() 
            LIMIT 10
        `, (err, players) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const formattedPlayers = players.map(player => ({
                id: player.id,
                full_name: player.full_name,
                team: player.team,
                position: player.position,
                jersey_number: player.jersey_number,
                stats: JSON.parse(player.stats)
            }));

            // Queue background updates for displayed players
            formattedPlayers.forEach(player => {
                req.statsUpdater.queueUpdate(player.id);
            });
            
            res.json(formattedPlayers);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search player with real-time updates
router.get('/players', async (req, res) => {
    try {
        const db = await initDatabase();
        const name = req.query.name;
        
        db.get(
            'SELECT * FROM players WHERE full_name LIKE ?',
            [`%${name}%`],
            async (err, player) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                if (!player) {
                    res.status(404).json({ error: 'Player not found' });
                    return;
                }
                
                try {
                    // Get real-time stats
                    const stats = await req.statsUpdater.getPlayerStats(player.id);
                    
                    res.json({
                        player: {
                            id: player.id,
                            full_name: player.full_name,
                            team: player.team,
                            position: player.position,
                            jersey_number: player.jersey_number,
                            stats: stats.career.map(season => ({
                                SEASON_ID: season.seasonId,
                                TEAM_ABBREVIATION: season.teamAbbreviation || player.team,
                                GP: season.gp,
                                MIN: season.min,
                                FG_PCT: season.fgPct,
                                FG3_PCT: season.fg3Pct,
                                FT_PCT: season.ftPct,
                                PTS: season.pts,
                                AST: season.ast,
                                REB: season.reb,
                                STL: season.stl,
                                BLK: season.blk
                            }))
                        }
                    });
                } catch (error) {
                    // Fallback to database stats if real-time update fails
                    res.json({
                        player: {
                            id: player.id,
                            full_name: player.full_name,
                            team: player.team,
                            position: player.position,
                            jersey_number: player.jersey_number,
                            stats: JSON.parse(player.stats)
                        }
                    });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get player stats for specific year with real-time updates
router.get('/players/:playerId/stats/:year', async (req, res) => {
    try {
        const stats = await req.statsUpdater.getPlayerStats(req.params.playerId);
        const yearStats = stats.career.find(season => 
            season.seasonId === req.params.year
        );
        
        if (!yearStats) {
            return res.status(404).json({ error: 'Stats not found for specified year' });
        }
        
        res.json(yearStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;