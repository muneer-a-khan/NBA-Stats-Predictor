const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const nba = require('nba-api-client');

// Database initialization remains the same
const initDatabase = async () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('nba_stats.db', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            db.run(`CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                full_name TEXT,
                team_id TEXT,
                team TEXT,
                position TEXT,
                stats TEXT
            )`, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(db);
            });
        });
    });
};

// Check if database is empty
const isDatabaseEmpty = async (db) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM players', (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row ? row.count === 0 : true);
        });
    });
};

// Format player stats
const formatPlayerStats = (stats) => {
    if (!stats || !stats.regularSeason) return {};
    
    const careerStats = stats.regularSeason.career;
    return {
        PTS: careerStats?.ppg || 0,
        AST: careerStats?.apg || 0,
        REB: careerStats?.rpg || 0,
        STL: careerStats?.spg || 0,
        BLK: careerStats?.bpg || 0,
        FG_PCT: careerStats?.fgp || 0,
        FG3_PCT: careerStats?.tpp || 0,
        FT_PCT: careerStats?.ftp || 0,
        MIN: careerStats?.mpg || 0,
        GP: careerStats?.gamesPlayed || 0
    };
};

// Populate database
const populateDatabase = async (db) => {
    try {
        const isEmpty = await isDatabaseEmpty(db);
        
        if (isEmpty) {
            console.log('Populating database with player data...');
            
            // Get all active players
            const players = await nba.allPlayers();
            
            for (const player of players) {
                try {
                    // Get player stats using the correct API method
                    const stats = await nba.playerProfile({ PersonID: player.personId });
                    const formattedStats = formatPlayerStats(stats);
                    
                    // Insert player data
                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT OR REPLACE INTO players (id, full_name, team_id, team, position, stats) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                player.personId,
                                player.fullName,
                                player.teamId,
                                player.teamSitesOnly?.teamName || '',
                                player.pos || '',
                                JSON.stringify(formattedStats)
                            ],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                    
                    // Add a small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error(`Error processing player ${player.fullName}:`, error);
                }
            }
            console.log('Database population complete');
        }
    } catch (error) {
        console.error('Error populating database:', error);
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
                ...player,
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
                    // Get player seasonal stats
                    const seasonalStats = await nba.playerProfile({ PersonID: player.id });
                    const seasons = seasonalStats.regularSeason.season || [];
                    
                    res.json({
                        player: {
                            ...player,
                            stats: seasons.map(season => ({
                                SEASON_ID: season.seasonId,
                                TEAM_ABBREVIATION: season.teamAbbreviation || '',
                                GP: season.gamesPlayed || 0,
                                MIN: season.mpg || 0,
                                FG_PCT: season.fgp || 0,
                                FG3_PCT: season.tpp || 0,
                                FT_PCT: season.ftp || 0,
                                PTS: season.ppg || 0,
                                AST: season.apg || 0,
                                REB: season.rpg || 0,
                                STL: season.spg || 0,
                                BLK: season.bpg || 0
                            }))
                        }
                    });
                } catch (error) {
                    res.json({
                        player: {
                            ...player,
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