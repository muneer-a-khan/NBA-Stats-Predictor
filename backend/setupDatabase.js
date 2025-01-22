const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'nba_stats.db');

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) {
                console.error('Failed to connect to SQLite database:', err.message);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database.');
            
            db.serialize(() => {
                // Create players table
                db.run(`
                    CREATE TABLE IF NOT EXISTS players (
                        id INTEGER PRIMARY KEY,
                        full_name TEXT,
                        team TEXT,
                        position TEXT,
                        jersey_number TEXT,
                        stats TEXT,
                        last_updated DATETIME
                    )
                `);

                // Create seasons table
                db.run(`
                    CREATE TABLE IF NOT EXISTS seasons (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        player_id INTEGER,
                        season_id TEXT,
                        team_abbreviation TEXT,
                        gp INTEGER,
                        min REAL,
                        pts REAL,
                        ast REAL,
                        reb REAL,
                        stl REAL,
                        blk REAL,
                        fg_pct REAL,
                        fg3_pct REAL,
                        ft_pct REAL,
                        FOREIGN KEY(player_id) REFERENCES players(id)
                    )
                `);
            });

            resolve(db);
        });
    });
};

module.exports = initializeDatabase;