import pandas as pd
import sqlite3
import json
import logging
from datetime import datetime
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='migration.log'
)

# File paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'nbastats')
DEST_DB = os.path.join(SCRIPT_DIR, '..', 'data', 'nba_stats.db')

def init_destination_db():
    """Initialize the destination database with proper schema."""
    conn = sqlite3.connect(DEST_DB)
    cursor = conn.cursor()
    
    # Drop existing tables if they exist
    cursor.execute('DROP TABLE IF EXISTS seasons')
    cursor.execute('DROP TABLE IF EXISTS players')
    
    # Create players table
    cursor.execute('''
        CREATE TABLE players (
            id INTEGER PRIMARY KEY,
            full_name TEXT,
            team TEXT,
            position TEXT,
            stats TEXT,
            last_updated DATETIME
        )
    ''')
    
    # Create seasons table
    cursor.execute('''
        CREATE TABLE seasons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            season_id TEXT,
            team TEXT,
            games INTEGER,
            minutes_per_game REAL,
            pts_per_game REAL,
            ast_per_game REAL,
            reb_per_game REAL,
            stl_per_game REAL,
            blk_per_game REAL,
            fg_percent REAL,
            fg3_percent REAL,
            ft_percent REAL,
            turnover_per_game REAL,
            FOREIGN KEY(player_id) REFERENCES players(id)
        )
    ''')
    
    conn.commit()
    return conn

def migrate_data():
    """Migrate data from CSV files to SQLite database."""
    try:
        # Read CSV files
        per_game_file = os.path.join(DATA_DIR, 'Player Per Game.csv')
        career_info_file = os.path.join(DATA_DIR, 'Player Career Info.csv')
        
        logging.info(f"Reading data from: {per_game_file}")
        per_game_df = pd.read_csv(per_game_file)
        career_info_df = pd.read_csv(career_info_file)
        
        # Initialize database
        dest_conn = init_destination_db()
        dest_cursor = dest_conn.cursor()
        
        # Get active players (2024 season)
        active_players = per_game_df[per_game_df['season'] == 2024].copy()
        player_ids = active_players['player_id'].unique()
        
        logging.info(f"Found {len(player_ids)} active players")
        
        for player_id in player_ids:
            try:
                # Get player's data
                player_games = per_game_df[per_game_df['player_id'] == player_id].copy()
                latest_season = player_games.iloc[-1]
                
                # Current season stats
                current_stats = {
                    'pts_per_game': float(latest_season['pts_per_game']),
                    'ast_per_game': float(latest_season['ast_per_game']),
                    'reb_per_game': float(latest_season['trb_per_game']),
                    'stl_per_game': float(latest_season['stl_per_game']),
                    'blk_per_game': float(latest_season['blk_per_game']),
                    'fg_percent': float(latest_season['fg_percent']),
                    'fg3_percent': float(latest_season['x3p_percent']),
                    'ft_percent': float(latest_season['ft_percent'])
                }
                
                # Insert into players table
                dest_cursor.execute('''
                    INSERT INTO players (id, full_name, team, position, stats, last_updated)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                ''', (
                    int(player_id),
                    latest_season['player'],
                    latest_season['tm'],
                    latest_season['pos'],
                    json.dumps(current_stats)
                ))
                
                # Insert all seasons for this player
                for _, season in player_games.iterrows():
                    dest_cursor.execute('''
                        INSERT INTO seasons (
                            player_id, season_id, team, games, minutes_per_game,
                            pts_per_game, ast_per_game, reb_per_game, stl_per_game,
                            blk_per_game, fg_percent, fg3_percent, ft_percent,
                            turnover_per_game
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        int(season['player_id']),
                        str(int(season['season'])),
                        season['tm'],
                        int(season['g']),
                        float(season['mp_per_game']),
                        float(season['pts_per_game']),
                        float(season['ast_per_game']),
                        float(season['trb_per_game']),
                        float(season['stl_per_game']),
                        float(season['blk_per_game']),
                        float(season['fg_percent']),
                        float(season['x3p_percent']),
                        float(season['ft_percent']),
                        float(season['tov_per_game'])
                    ))
                
                dest_conn.commit()
                logging.info(f"Processed player: {latest_season['player']}")
                
            except Exception as e:
                logging.error(f"Error processing player {player_id}: {str(e)}")
                continue
        
        logging.info("Migration completed successfully")
        
    except Exception as e:
        logging.error(f"Migration failed: {str(e)}")
        raise
    finally:
        dest_conn.close()

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        logging.error(f"Migration failed: {str(e)}")
        import sys
        sys.exit(1)