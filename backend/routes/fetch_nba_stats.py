from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
import sys
import json
import sqlite3
import time
import math

DB_FILE = "../nba_players.db"

def calculate_career_averages(stats):
    """Calculate career averages for a player's stats."""
    if not stats:
        return {}
    
    valid_stats = [s for s in stats if all(
        s.get(key) not in (None, "NaN", float("NaN")) for key in ["PTS", "AST", "REB", "STL", "BLK"]
    )]

    if not valid_stats:  # If no valid stats exist, return empty averages
        return {"PTS": 0, "AST": 0, "REB": 0, "STL": 0, "BLK": 0}

    career_totals = {
        "PTS": sum(float(s.get("PTS", 0)) for s in valid_stats) / len(valid_stats),
        "AST": sum(float(s.get("AST", 0)) for s in valid_stats) / len(valid_stats),
        "REB": sum(float(s.get("REB", 0)) for s in valid_stats) / len(valid_stats),
        "STL": sum(float(s.get("STL", 0)) for s in valid_stats) / len(valid_stats),
        "BLK": sum(float(s.get("BLK", 0)) for s in valid_stats) / len(valid_stats),
    }
    return {k: round(v, 2) for k, v in career_totals.items()}


def clean_stats(stats):
    """Replace NaN and invalid values with 0."""
    cleaned_stats = []
    for stat in stats:
        cleaned_stat = {k: (0 if v in (None, "NaN", float("NaN")) else v) for k, v in stat.items()}
        cleaned_stats.append(cleaned_stat)
    return cleaned_stats


def save_to_database(players):
    """Save player data to SQLite."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY,
            full_name TEXT,
            team TEXT,
            position TEXT,
            stats TEXT
        )
    """)

    insert_or_update = """
        INSERT INTO players (id, full_name, team, position, stats)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        full_name = excluded.full_name,
        team = excluded.team,
        position = excluded.position,
        stats = excluded.stats
    """

    for player in players:
        cursor.execute(insert_or_update, (
            player["id"],
            player["full_name"],
            player["team"],
            player["position"],
            json.dumps(player["stats"]),
        ))
    
    conn.commit()
    conn.close()

def fetch_all_players():
    """Fetch all players and save to database in chunks."""
    all_players = players.get_players()
    chunk_size = 100
    total_players = len(all_players)

    for i in range(0, total_players, chunk_size):
        chunk = all_players[i:i+chunk_size]
        result = []

        for player in chunk:
            try:
                career_stats = playercareerstats.PlayerCareerStats(player_id=player["id"])
                stats = career_stats.get_data_frames()[0].to_dict(orient="records") if not career_stats.get_data_frames()[0].empty else []
                stats = clean_stats(stats)  # Clean invalid values
                averages = calculate_career_averages(stats)  # Calculate career averages
                result.append({
                    "id": player["id"],
                    "full_name": player["full_name"],
                    "team": "N/A",
                    "position": "N/A",
                    "stats": averages
                })
            except Exception as e:
                print(f"Error fetching data for {player['full_name']}: {str(e)}")
                continue

        
        save_to_database(result)
        print(f"Processed players {i+1} to {min(i+chunk_size, total_players)} of {total_players}.")
        time.sleep(1)  # Pause to respect rate limits

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "all":
            fetch_all_players()
        else:
            print(json.dumps({"error": "Invalid argument."}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
