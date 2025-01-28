import sqlite3
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KAGGLE_DB = os.path.join(SCRIPT_DIR, '..', 'data', 'nba.sqlite')

def debug_source_db():
    print(f"Looking for database at: {KAGGLE_DB}")
    print(f"Database exists: {os.path.exists(KAGGLE_DB)}")
    
    try:
        conn = sqlite3.connect(KAGGLE_DB)
        cursor = conn.cursor()
        
        # Check active players
        cursor.execute('SELECT COUNT(*) FROM player WHERE is_active = 1')
        active_count = cursor.fetchone()[0]
        print(f"\nActive players: {active_count}")
        
        # Sample some active players
        cursor.execute('''
            SELECT p.id, p.full_name, cpi.team_abbreviation, cpi.position 
            FROM player p 
            LEFT JOIN common_player_info cpi ON p.id = cpi.person_id 
            WHERE p.is_active = 1 
            LIMIT 5
        ''')
        players = cursor.fetchall()
        print("\nSample active players:")
        for player in players:
            print(f"- ID: {player[0]}, Name: {player[1]}, Team: {player[2]}, Position: {player[3]}")
            
        # Check game stats
        cursor.execute('SELECT COUNT(*) FROM game')
        game_count = cursor.fetchone()[0]
        print(f"\nTotal games: {game_count}")
        
        # Sample game stats for first player
        if players:
            first_player = players[0][0]  # Get ID of first player
            cursor.execute('''
                SELECT season_id, COUNT(DISTINCT game_id) 
                FROM game 
                WHERE team_id_home = ? OR team_id_away = ?
                GROUP BY season_id
            ''', (first_player, first_player))
            seasons = cursor.fetchall()
            print(f"\nSeason stats for {players[0][1]}:")
            for season in seasons:
                print(f"- Season {season[0]}: {season[1]} games")
        
        conn.close()
    except Exception as e:
        print(f"Error accessing database: {str(e)}")

if __name__ == "__main__":
    debug_source_db()