const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { exec } = require("child_process");
const router = express.Router();

const DB_FILE = "./nba_players.db";

// Load all players into the database
router.get("/load-all", (req, res) => {
  exec('python routes/fetch_nba_stats.py "all"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution Error: ${error.message}`);
      res.status(500).json({ error: "Failed to load all players." });
      return;
    }

    if (stderr) {
      console.error(`Python Script Error: ${stderr}`);
      res.status(500).json({ error: stderr });
      return;
    }

    res.json({ message: "All players loaded successfully." });
  });
});

// Get random players
router.get("/random-players", (req, res) => {
  const db = new sqlite3.Database(DB_FILE);

  db.all(
    "SELECT * FROM players ORDER BY RANDOM() LIMIT 10",
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch random players." });
        return;
      }

      const players = rows.map((row) => {
        const stats = JSON.parse(row.stats || "{}");
        return {
          id: row.id,
          full_name: row.full_name,
          team: row.team,
          position: row.position,
          stats,
        };
      });

      res.json(players);
    }
  );

  db.close();
});

// Search for a player by name
router.get("/", (req, res) => {
  const playerName = req.query.name;
  if (!playerName) {
    res.status(400).json({ error: "Player name is required." });
    return;
  }

  const db = new sqlite3.Database(DB_FILE);

  db.get(
    "SELECT * FROM players WHERE LOWER(full_name) = ?",
    [playerName.toLowerCase()],
    (err, row) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch player." });
        return;
      }

      if (!row) {
        res.status(404).json({ error: "Player not found." });
        return;
      }

      const stats = JSON.parse(row.stats || "[]");
      res.json({
        player: {
          id: row.id,
          full_name: row.full_name,
          team: row.team,
          position: row.position,
        },
        stats,
      });
    }
  );

  db.close();
});

module.exports = router;
