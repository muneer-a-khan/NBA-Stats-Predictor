const { NBA } = require('nba');
const NodeCache = require('node-cache');
const schedule = require('node-schedule');
const sqlite3 = require('sqlite3').verbose();

class StatsUpdater {
    constructor() {
        // Cache configuration: 1 hour TTL
        this.cache = new NodeCache({ stdTTL: 3600 });
        this.db = new sqlite3.Database('nba_stats.db');
        this.updateQueue = new Set();
        this.isUpdating = false;
    }

    async getPlayerStats(playerId) {
        // Try cache first
        const cachedStats = this.cache.get(`player_${playerId}`);
        if (cachedStats) {
            // Queue background update if stats are older than 6 hours
            if (Date.now() - cachedStats.timestamp > 6 * 60 * 60 * 1000) {
                this.queueUpdate(playerId);
            }
            return cachedStats.data;
        }

        // If not in cache, fetch and cache
        const stats = await this.fetchAndCacheStats(playerId);
        return stats;
    }

    async fetchAndCacheStats(playerId) {
        try {
            // Fetch from NBA API
            const playerInfo = await NBA.stats.playerInfo({ PlayerID: playerId });
            const careerStats = await NBA.stats.playerProfile({ PlayerID: playerId });

            const stats = {
                info: playerInfo.playerHeadlineStats[0],
                career: careerStats.seasonTotalsRegularSeason,
                timestamp: Date.now()
            };

            // Cache the results
            this.cache.set(`player_${playerId}`, {
                data: stats,
                timestamp: Date.now()
            });

            // Update database
            await this.updateDatabase(playerId, stats);

            return stats;
        } catch (error) {
            console.error(`Error fetching stats for player ${playerId}:`, error);
            throw error;
        }
    }

    async updateDatabase(playerId, stats) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE players 
                SET stats = ?, last_updated = datetime('now')
                WHERE id = ?`,
                [JSON.stringify(stats), playerId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    queueUpdate(playerId) {
        this.updateQueue.add(playerId);
        if (!this.isUpdating) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.updateQueue.size === 0 || this.isUpdating) {
            return;
        }

        this.isUpdating = true;
        const playerId = Array.from(this.updateQueue)[0];
        this.updateQueue.delete(playerId);

        try {
            await this.fetchAndCacheStats(playerId);
        } catch (error) {
            console.error(`Error updating player ${playerId}:`, error);
        }

        this.isUpdating = false;
        // Process next in queue
        if (this.updateQueue.size > 0) {
            setTimeout(() => this.processQueue(), 1000); // Rate limiting
        }
    }

    scheduleUpdates() {
        // Update active players daily at 4 AM
        schedule.scheduleJob('0 4 * * *', async () => {
            try {
                const { spawn } = require('child_process');
                const updateProcess = spawn('python', ['incremental_update.py']);

                updateProcess.stdout.on('data', (data) => {
                    console.log(`Update output: ${data}`);
                });

                updateProcess.stderr.on('data', (data) => {
                    console.error(`Update error: ${data}`);
                });
            } catch (error) {
                console.error('Error running scheduled update:', error);
            }
        });
    }
}

// Middleware to attach stats updater to requests
const statsUpdaterMiddleware = (req, res, next) => {
    if (!req.app.locals.statsUpdater) {
        req.app.locals.statsUpdater = new StatsUpdater();
        req.app.locals.statsUpdater.scheduleUpdates();
    }
    req.statsUpdater = req.app.locals.statsUpdater;
    next();
};

module.exports = { StatsUpdater, statsUpdaterMiddleware };