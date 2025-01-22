const sqlite3 = require('sqlite3').verbose();

const initializeDatabase = () => {
    const db = new sqlite3.Database('./nba_players.db', (err) => {
        if (err) {
            console.error('Failed to connect to SQLite database:', err.message);
        } else {
            console.log('Connected to SQLite database.');
        }
    });

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY,
                full_name TEXT,
                team TEXT,
                position TEXT,
                stats TEXT
            )
        `);
    });

    return db;
};

module.exports = initializeDatabase;
