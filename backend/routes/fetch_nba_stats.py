from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
import sys
import json
import random

def calculate_career_averages(stats):
    """Calculate career averages for a player's stats."""
    if not stats:
        return {}
    
    career_totals = {
        "PTS": sum(float(s["PTS"]) for s in stats if s["PTS"] not in (None, "")) / len(stats),
        "AST": sum(float(s["AST"]) for s in stats if s["AST"] not in (None, "")) / len(stats),
        "REB": sum(float(s["REB"]) for s in stats if s["REB"] not in (None, "")) / len(stats),
        "STL": sum(float(s["STL"]) for s in stats if s["STL"] not in (None, "")) / len(stats),
        "BLK": sum(float(s["BLK"]) for s in stats if s["BLK"] not in (None, "")) / len(stats),
    }
    return {k: round(v, 2) for k, v in career_totals.items()}

def clean_stats(stats):
    """Replace NaN and invalid values with None."""
    cleaned_stats = []
    for stat in stats:
        cleaned_stat = {k: (None if v != v else v) for k, v in stat.items()}  # Replace NaN with None
        cleaned_stats.append(cleaned_stat)
    return cleaned_stats

try:
    arg = sys.argv[1]

    if arg == "all":
        all_players = players.get_players()
        random.shuffle(all_players)  # Shuffle the list to ensure randomness
        result = []
        for player in all_players[:100]:  # Limit to 100 players for testing
            try:
                career_stats = playercareerstats.PlayerCareerStats(player_id=player["id"])
                stats = career_stats.get_data_frames()[0].to_dict(orient="records") if not career_stats.get_data_frames()[0].empty else []
                stats = clean_stats(stats)  # Clean NaN values
                averages = calculate_career_averages(stats)  # Calculate career averages
                result.append({
                    "id": player["id"],
                    "full_name": player["full_name"],
                    "team": "N/A",
                    "position": "N/A",
                    "stats": averages  # Only return career averages
                })
            except Exception as e:
                print(f"Error fetching stats for {player['full_name']}: {str(e)}")

        print(json.dumps(result))
    else:
        player_name = arg.lower()
        player = next((p for p in players.get_players() if p["full_name"].lower() == player_name), None)

        if not player:
            print(json.dumps({"error": "Player not found"}))
            sys.exit()

        career_stats = playercareerstats.PlayerCareerStats(player_id=player["id"])
        stats = career_stats.get_data_frames()[0].to_dict(orient="records")
        stats = clean_stats(stats)  # Clean NaN values

        print(json.dumps({
            "player": {
                "id": player["id"],
                "full_name": player["full_name"],
                "team": "N/A",
                "position": "N/A"
            },
            "stats": stats  # Return all career stats for the searched player
        }))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
