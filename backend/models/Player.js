class Player {
    constructor(db) {
        this.db = db;
    }

    async findById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM players WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? this.formatPlayer(row) : null);
                }
            );
        });
    }

    async findByName(name) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM players WHERE full_name LIKE ?',
                [`%${name}%`],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? this.formatPlayer(row) : null);
                }
            );
        });
    }

    async getRandomPlayers(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM players ORDER BY RANDOM() LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => this.formatPlayer(row)));
                }
            );
        });
    }

    async getPlayerSeasons(playerId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM seasons WHERE player_id = ? ORDER BY season_id DESC',
                [playerId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getSeasonStats(playerId, seasonId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM seasons WHERE player_id = ? AND season_id = ?',
                [playerId, seasonId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updatePlayerStats(playerId, stats) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE players SET 
                stats = ?,
                last_updated = datetime('now')
                WHERE id = ?`,
                [JSON.stringify(stats), playerId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async addSeasonStats(stats) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO seasons 
                (player_id, season_id, team_abbreviation, gp, min, pts, ast, reb, stl, blk, fg_pct, fg3_pct, ft_pct)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    stats.playerId,
                    stats.seasonId,
                    stats.teamAbbreviation,
                    stats.gp,
                    stats.min,
                    stats.pts,
                    stats.ast,
                    stats.reb,
                    stats.stl,
                    stats.blk,
                    stats.fgPct,
                    stats.fg3Pct,
                    stats.ftPct
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    formatPlayer(row) {
        return {
            id: row.id,
            full_name: row.full_name,
            team: row.team,
            position: row.position,
            jersey_number: row.jersey_number,
            stats: JSON.parse(row.stats),
            last_updated: row.last_updated
        };
    }
}

module.exports = Player;