const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const NBA = require('nba');
const axios = require('axios');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Check if column exists in table
const columnExists = async (db, tableName, columnName) => {
    return new Promise((resolve, reject) => {
        db.get(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const columns = rows || [];
            resolve(columns.some(col => col.name === columnName));
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

// Retry function with exponential backoff
const fetchWithRetry = async (playerInfo, retries = 3, baseDelay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await NBA.stats.playerInfo({ PlayerID: playerInfo.playerId });
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            const waitTime = baseDelay * Math.pow(2, i);
            await delay(waitTime);
        }
    }
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

// Populate database
const populateDatabase = async (db) => {
    try {
        console.log('Checking for new or outdated player data...');
        
        const nbaPlayers = NBA.players;
        const existingPlayers = await getExistingPlayers(db);
        const existingPlayerMap = new Map(
            existingPlayers.map(p => [p.id, new Date(p.last_updated)])
        );
        
        const oneDay = 24 * 60 * 60 * 1000;
        const playersToUpdate = nbaPlayers.filter(player => {
            const lastUpdated = existingPlayerMap.get(parseInt(player.playerId));
            return !lastUpdated || (new Date() - lastUpdated > oneDay);
        });
        
        if (playersToUpdate.length === 0) {
            console.log('All player data is up to date!');
            return;
        }
        
        console.log(`Updating data for ${playersToUpdate.length} players...`);
        
        const batchSize = 5;
        for (let i = 0; i < playersToUpdate.length; i += batchSize) {
            const batch = playersToUpdate.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (player, index) => {
                try {
                    await delay(index * 2000);
                    
                    const playerInfo = await fetchWithRetry(player);
                    const stats = playerInfo.playerHeadlineStats[0] || {};
                    
                    const formattedStats = formatPlayerStats({
                        PTS: parseFloat(stats.pts) || 0,
                        AST: parseFloat(stats.ast) || 0,
                        REB: parseFloat(stats.reb) || 0,
                        STL: parseFloat(stats.stl) || 0,
                        BLK: parseFloat(stats.blk) || 0,
                        FG_PCT: parseFloat(stats.fgPct) || 0,
                        FG3_PCT: parseFloat(stats.fg3Pct) || 0,
                        FT_PCT: parseFloat(stats.ftPct) || 0,
                        MIN: parseFloat(stats.min) || 0,
                        GP: parseInt(stats.gp) || 0
                    });

                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT OR REPLACE INTO players 
                            (id, full_name, team, position, jersey_number, stats, last_updated) 
                            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                            [
                                player.playerId,
                                player.fullName,
                                player.teamData ? player.teamData.abbreviation : '',
                                player.pos || '',
                                player.jersey || '',
                                JSON.stringify(formattedStats)
                            ],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                    
                    console.log(`Successfully updated player: ${player.fullName}`);
                } catch (error) {
                    console.error(`Error processing player ${player.fullName}:`, error.message);
                }
            }));
            
            await delay(5000);
        }
        
        console.log('Player data update complete');
    } catch (error) {
        console.error('Error updating player data:', error);
        throw error;
    }
};

// Get random players
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

// Initialize database when server starts
(async () => {
    try {
        const db = await initDatabase();
        await populateDatabase(db);
    } catch (error) {
        console.error('Error initializing database:', error);
    }
})();

module.exports = router;