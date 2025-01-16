from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
import sys
import json

try:
    # Get argument from command line
    arg = sys.argv[1]

    if arg == "all":
        all_players = players.get_players()
        # Limit to the first 10 players for testing
        limited_players = all_players[:10]
        result = [{"id": p["id"], "full_name": p["full_name"], "team": "N/A"} for p in limited_players]
        print(json.dumps(result))
    else:
        # Fetch stats for a specific player
        player_name = arg
        player = next((p for p in players.get_players() if p['full_name'].lower() == player_name.lower()), None)

        if not player:
            print(json.dumps({"error": "Player not found"}))
            sys.exit()

        career = playercareerstats.PlayerCareerStats(player_id=player['id'])
        stats = career.get_data_frames()[0].to_dict(orient="records")
        print(json.dumps({"player": player, "stats": stats}))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
