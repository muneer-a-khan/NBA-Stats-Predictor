import sqlite3
import os

def check_migration():
    db_path = os.path.join('..', 'data', 'nba_stats.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check player count
    cursor.execute("SELECT COUNT(*) FROM players")
    player_count = cursor.fetchone()[0]
    print(f"Total players: {player_count}")
    
    # Check season count
    cursor.execute("SELECT COUNT(*) FROM seasons")
    season_count = cursor.fetchone()[0]
    print(f"Total season records: {season_count}")
    
    # Sample some data
    cursor.execute("SELECT * FROM players LIMIT 3")
    print("\nSample players:")
    for player in cursor.fetchall():
        print(f"- {player[1]} ({player[2]})")
    
    conn.close()

if __name__ == "__main__":
    check_migration()