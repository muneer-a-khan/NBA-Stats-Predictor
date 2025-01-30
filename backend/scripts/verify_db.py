import sqlite3
import os

def verify_database():
    db_path = os.path.join('..', 'data', 'nba_stats.db')
    print(f"Checking database at: {db_path}")
    print(f"Database exists: {os.path.exists(db_path)}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check players table
        cursor.execute("SELECT COUNT(*) FROM players")
        player_count = cursor.fetchone()[0]
        print(f"\nNumber of players in database: {player_count}")
        
        # Check sample players
        cursor.execute("SELECT id, full_name, team FROM players LIMIT 5")
        print("\nSample players:")
        for player in cursor.fetchall():
            print(f"- {player[1]} ({player[2]})")
        
        # Check seasons table
        cursor.execute("SELECT COUNT(*) FROM seasons")
        season_count = cursor.fetchone()[0]
        print(f"\nNumber of seasons records: {season_count}")
        
        # Check sample season stats
        cursor.execute("""
            SELECT p.full_name, s.season_id, s.pts_per_game, s.ast_per_game, s.reb_per_game 
            FROM players p 
            JOIN seasons s ON p.id = s.player_id 
            LIMIT 5
        """)
        print("\nSample season stats:")
        for stat in cursor.fetchall():
            print(f"- {stat[0]} ({stat[1]}): {stat[2]} PPG, {stat[3]} APG, {stat[4]} RPG")
        
        conn.close()
    except Exception as e:
        print(f"Error checking database: {str(e)}")

if __name__ == "__main__":
    verify_database()