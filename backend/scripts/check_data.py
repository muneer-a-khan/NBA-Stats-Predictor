import sqlite3
import os

# Get the correct paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Gets backend folder
APP_DB = os.path.join(BASE_DIR, 'data', 'nba_stats.db')  # Path to database file

def check_player_data(player_name):
    """Check stats for a specific player."""
    conn = sqlite3.connect(APP_DB)
    cursor = conn.cursor()
    
    print(f"\nChecking {player_name}'s data:\n")
    print(f"{player_name}'s stats:")
    print("Name, Season, Team, MPG, PPG, APG, RPG")
    
    # Get all seasons for the player
    cursor.execute('''
        SELECT p.full_name, s.season, s.team, s.minutes_per_game, s.pts_per_game, s.ast_per_game, s.reb_per_game
        FROM players p
        JOIN seasons s ON s.player_id = p.id
        WHERE p.full_name = ?
        ORDER BY s.season ASC
    ''', (player_name,))
    
    rows = cursor.fetchall()
    for row in rows:
        print(f"{row[0]}, {row[1]}, {row[2]}, {row[3]:.1f}, {row[4]:.1f}, {row[5]:.1f}, {row[6]:.1f}")
    
    conn.close()

if __name__ == "__main__":
    check_player_data("Luka Dončić")
    check_player_data("Dario Šarić")
