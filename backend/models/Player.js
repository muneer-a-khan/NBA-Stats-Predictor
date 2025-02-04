// Helper function to normalize text (remove accents and convert to lowercase)
function normalizeText(text) {
    if (!text) return '';
    return text.normalize('NFKD')
               .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
               .toLowerCase()
               .trim();
}

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

    findByName(name) {
        return new Promise((resolve, reject) => {
            const normalizedName = normalizeText(name);
            
            const query = `
                SELECT p.*, s.*
                FROM players p
                LEFT JOIN seasons s ON p.id = s.player_id
                WHERE lower(p.full_name) LIKE ?
                ORDER BY s.season DESC`;
            
            this.db.all(query, [`%${normalizedName}%`], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Filter players by normalized name in JavaScript for accurate matching
                const filteredRows = rows.filter(row => {
                    const normalizedFullName = normalizeText(row.full_name);
                    return normalizedFullName.includes(normalizedName);
                });

                // Group the results by player
                const players = new Map();
                filteredRows.forEach(row => {
                    if (!players.has(row.id)) {
                        players.set(row.id, {
                            id: row.id,
                            full_name: row.full_name,
                            birth_year: row.birth_year,
                            position: row.position,
                            seasons: []
                        });
                    }
                    
                    if (row.season) {  // Only add season if it exists
                        players.get(row.id).seasons.push({
                            season: row.season,
                            team: row.team,
                            games: row.games,
                            games_started: row.games_started,
                            minutes_per_game: row.minutes_per_game,
                            pts_per_game: row.pts_per_game,
                            ast_per_game: row.ast_per_game,
                            reb_per_game: row.reb_per_game,
                            stl_per_game: row.stl_per_game,
                            blk_per_game: row.blk_per_game,
                            fg_percent: row.fg_percent,
                            fg3_percent: row.fg3_percent,
                            ft_percent: row.ft_percent,
                            turnover_per_game: row.turnover_per_game
                        });
                    }
                });

                // Sort seasons for each player in descending order
                for (let player of players.values()) {
                    player.seasons.sort((a, b) => parseInt(b.season) - parseInt(a.season));
                }

                resolve(Array.from(players.values()));
            });
        });
    }

    groupPlayerSeasons(rows) {
        const players = new Map();
        
        rows.forEach(row => {
            if (!players.has(row.id)) {
                players.set(row.id, {
                    id: row.id,
                    full_name: row.full_name,
                    birth_year: row.birth_year,
                    position: row.position,
                    seasons: []
                });
            }

            if (row.season) {
                players.get(row.id).seasons.push({
                    season: row.season,
                    team: row.team,
                    games: row.games,
                    games_started: row.games_started,
                    minutes_per_game: row.minutes_per_game,
                    pts_per_game: row.pts_per_game,
                    ast_per_game: row.ast_per_game,
                    reb_per_game: row.reb_per_game,
                    stl_per_game: row.stl_per_game,
                    blk_per_game: row.blk_per_game,
                    fg_percent: row.fg_percent,
                    fg3_percent: row.fg3_percent,
                    ft_percent: row.ft_percent,
                    turnover_per_game: row.turnover_per_game
                });
            }
        });

        // Sort seasons for each player
        for (let player of players.values()) {
            player.seasons.sort((a, b) => parseInt(b.season) - parseInt(a.season));
        }

        return players;
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
            birth_year: row.birth_year,
            position: row.position
        };
    }
}

module.exports = Player;