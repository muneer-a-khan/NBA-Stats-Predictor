const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const NBA = require('nba');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Check if column exists in table
const columnExists = async (db, tableName, columnName) => {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            // Check if any row has the column name we're looking for
            const exists = rows.some(row => row.name === columnName);
            resolve(exists);
        });
    });
};

// Add last_updated column if it doesn't exist
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

// Get existing players from database
const getExistingPlayers = async (db) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, last_updated FROM players', (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

// Format player stats with default values
const formatPlayerStats = (stats = {}) => ({
    PTS: 0,
    AST: 0,
    REB: 0,
    STL: 0,
    BLK: 0,
    FG_PCT: 0,
    FG3_PCT: 0,
    FT_PCT: 0,
    MIN: 0,
    GP: 0,
    ...stats
});

// Initialize database
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
            
            res.json(formattedPlayers);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search player
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
                    const seasonalStats = await NBA.stats.playerProfile({ PlayerID: player.id });
                    const seasons = seasonalStats.seasonTotalsRegularSeason || [];
                    
                    res.json({
                        player: {
                            id: player.id,
                            full_name: player.full_name,
                            team: player.team,
                            position: player.position,
                            jersey_number: player.jersey_number,
                            stats: seasons.map(season => ({
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

module.exports = router;