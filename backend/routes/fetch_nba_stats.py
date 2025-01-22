from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
import sys
import json
import sqlite3
import time
import math
from requests.exceptions import RequestException

DB_FILE = "nba_stats.db"

def handle_rate_limit():
    """Sleep when rate limit is hit"""
    time.sleep(2)  # Wait 2 seconds between requests

def fetch_with_retry(player_id, max_retries=3):
    """Fetch player stats with retry logic"""
    for attempt in range(max_retries):
        try:
            career_stats = playercareerstats.PlayerCareerStats(player_id=player_id)
            return career_stats.get_data_frames()[0].to_dict(orient="records")
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                wait_time = (attempt + 1) * 2
                time.sleep(wait_time)
                continue
            raise e
    raise Exception(f"Failed to fetch stats after {max_retries} attempts")

def calculate_career_averages(stats):
    """Calculate career averages for a player's stats."""
    if not stats:
        return {}
    
    valid_stats = [s for s in stats if all(
        s.get(key) not in (None, "NaN", float("NaN")) for key in ["PTS", "AST", "REB", "STL", "BLK"]
    )]

    if not valid_stats:
        return {"PTS": 0, "AST": 0, "REB": 0, "STL": 0, "BLK": 0}

    career_totals = {
        "PTS": sum(float(s.get("PTS", 0)) for s in valid_stats) / len(valid_stats),
        "AST": sum(float(s.get("AST", 0)) for s in valid_stats) / len(valid_stats),
        "REB": sum(float(s.get("REB", 0)) for s in valid_stats) / len(valid_stats),
        "STL": sum(float(s.get("STL", 0)) for s in valid_stats) / len(valid_stats),
        "BLK": sum(float(s.get("BLK", 0)) for s in valid_stats) / len(valid_stats),
    }
    return {k: round(v, 2) for k, v in career_totals.items()}

def fetch_all_players():
    """Fetch all players and save to database in chunks."""
    try:
        all_players = players.get_players()
        chunk_size = 50  # Reduced chunk size for better rate limit handling
        total_players = len(all_players)

        for i in range(0, total_players, chunk_size):
            chunk = all_players[i:i+chunk_size]
            result = []

            for player in chunk:
                try:
                    stats = fetch_with_retry(player["id"])
                    stats = [s for s in stats if any(s.values())]  # Remove empty stats
                    averages = calculate_career_averages(stats)
                    
                    result.append({
                        "id": player["id"],
                        "full_name": player["full_name"],
                        "team": "N/A",
                        "position": "N/A",
                        "stats": averages
                    })
                    
                    handle_rate_limit()  # Respect rate limits
                    
                except Exception as e:
                    print(f"Error fetching data for {player['full_name']}: {str(e)}")
                    continue

            save_to_database(result)
            print(f"Processed players {i+1} to {min(i+chunk_size, total_players)} of {total_players}.")
            time.sleep(2)  # Additional delay between chunks

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)