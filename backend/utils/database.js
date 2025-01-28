const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'nba_stats.db');

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.db);
            });
        });
    }

    close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.db = null;
                    resolve();
                });
            });
        }
        return Promise.resolve();
    }

    getRandomPlayers(limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, json_group_array(
                    json_object(
                        'season_id', s.season_id,
                        'team_abbreviation', s.team_abbreviation,
                        'gp', s.gp,
                        'pts', s.pts,
                        'ast', s.ast,
                        'reb', s.reb,
                        'stl', s.stl,
                        'blk', s.blk,
                        'fg_pct', s.fg_pct,
                        'fg3_pct', s.fg3_pct,
                        'ft_pct', s.ft_pct
                    )
                ) as seasons
                FROM players p
                LEFT JOIN seasons s ON p.id = s.player_id
                GROUP BY p.id
                ORDER BY RANDOM()
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows.map(row => ({
                    ...row,
                    seasons: JSON.parse(row.seasons)
                })));
            });
        });
    }

    searchPlayer(name) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, json_group_array(
                    json_object(
                        'season_id', s.season_id,
                        'team_abbreviation', s.team_abbreviation,
                        'gp', s.gp,
                        'pts', s.pts,
                        'ast', s.ast,
                        'reb', s.reb,
                        'stl', s.stl,
                        'blk', s.blk,
                        'fg_pct', s.fg_pct,
                        'fg3_pct', s.fg3_pct,
                        'ft_pct', s.ft_pct
                    )
                ) as seasons
                FROM players p
                LEFT JOIN seasons s ON p.id = s.player_id
                WHERE p.full_name LIKE ?
                GROUP BY p.id
            `;
            
            this.db.get(query, [`%${name}%`], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (row) {
                    row.seasons = JSON.parse(row.seasons);
                }
                resolve(row);
            });
        });
    }

    getPlayerSeasons(playerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT *
                FROM seasons
                WHERE player_id = ?
                ORDER BY season_id DESC
            `;
            
            this.db.all(query, [playerId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }
}

module.exports = new Database();