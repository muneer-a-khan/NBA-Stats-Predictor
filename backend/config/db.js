const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'nba_stats.db');

const initializeDB = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        await createTables(db);
        resolve(db);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const createTables = (db) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Players table
      db.run(`CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY,
        full_name TEXT,
        team TEXT,
        position TEXT,
        jersey_number TEXT,
        stats TEXT,
        last_updated DATETIME
      )`);

      // Seasons table for historical data
      db.run(`CREATE TABLE IF NOT EXISTS seasons (
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
      )`);
      
      resolve();
    });
  });
};

module.exports = {
  initializeDB,
  DB_PATH
};