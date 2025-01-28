import sys
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
    filename='data_migration.log'
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KAGGLE_DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'nbastats')
APP_DB = os.path.join(SCRIPT_DIR, '..', 'data', 'nba_stats.db')

def init_database():
    """Initialize the application database."""
    try:
        conn = sqlite3.connect(APP_DB)
        cursor = conn.cursor()
        
        # Drop existing tables
        cursor.execute('DROP TABLE IF EXISTS seasons')
        cursor.execute('DROP TABLE IF EXISTS players')
        
        # Create players table
        cursor.execute('''
            CREATE TABLE players (
                id INTEGER PRIMARY KEY,
                full_name TEXT,
                birth_year INTEGER,
                position TEXT,
                team TEXT,
                stats TEXT,
                last_updated DATETIME
            )
        ''')
        
        # Create seasons table
        cursor.execute('''
            CREATE TABLE seasons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                season TEXT,
                team TEXT,
                games INTEGER,
                games_started INTEGER,
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
    except Exception as e:
        logging.error(f"Database initialization error: {e}")
        raise

def migrate_data():
    """Migrate NBA stats data to application database."""
    try:
        # Read data files
        per_game_stats = pd.read_csv(os.path.join(KAGGLE_DATA_DIR, 'player_per_game.csv'))
        player_info = pd.read_csv(os.path.join(KAGGLE_DATA_DIR, 'player_career_info.csv'))
        
        # Filter for NBA era only
        nba_stats = per_game_stats[per_game_stats['lg'] == 'NBA'].copy()
        
        # Initialize database
        conn = init_database()
        cursor = conn.cursor()
        
        # Process players
        unique_players = nba_stats[['player_id', 'player', 'birth_year', 'pos']].drop_duplicates()
        
        for _, player in unique_players.iterrows():
            try:
                # Get player's most recent team
                latest_season = nba_stats[nba_stats['player_id'] == player['player_id']].iloc[-1]
                
                # Get player's current season stats for the 'stats' JSON field
                current_stats = {
                    'games': int(latest_season['g']),
                    'points': float(latest_season['pts_per_game']),
                    'assists': float(latest_season['ast_per_game']),
                    'rebounds': float(latest_season['trb_per_game']),
                    'steals': float(latest_season['stl_per_game']),
                    'blocks': float(latest_season['blk_per_game']),
                    'fg_percent': float(latest_season['fg_percent']) if pd.notna(latest_season['fg_percent']) else 0,
                    'fg3_percent': float(latest_season['x3p_percent']) if pd.notna(latest_season['x3p_percent']) else 0,
                    'ft_percent': float(latest_season['ft_percent']) if pd.notna(latest_season['ft_percent']) else 0
                }
                
                # Insert player
                cursor.execute('''
                    INSERT INTO players (id, full_name, birth_year, position, team, stats, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                ''', (
                    int(player['player_id']),
                    player['player'],
                    int(player['birth_year']) if pd.notna(player['birth_year']) else None,
                    player['pos'],
                    latest_season['tm'],
                    json.dumps(current_stats)
                ))
                
                # Insert all seasons for player
                player_seasons = nba_stats[nba_stats['player_id'] == player['player_id']]
                for _, season in player_seasons.iterrows():
                    cursor.execute('''
                        INSERT INTO seasons (
                            player_id, season, team, games, games_started,
                            minutes_per_game, pts_per_game, ast_per_game,
                            reb_per_game, stl_per_game, blk_per_game,
                            fg_percent, fg3_percent, ft_percent, turnover_per_game
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        int(season['player_id']),
                        str(season['season']),
                        season['tm'],
                        int(season['g']),
                        int(season['gs']) if pd.notna(season['gs']) else 0,
                        float(season['mp_per_game']) if pd.notna(season['mp_per_game']) else 0,
                        float(season['pts_per_game']),
                        float(season['ast_per_game']),
                        float(season['trb_per_game']),
                        float(season['stl_per_game']) if pd.notna(season['stl_per_game']) else 0,
                        float(season['blk_per_game']) if pd.notna(season['blk_per_game']) else 0,
                        float(season['fg_percent']) if pd.notna(season['fg_percent']) else 0,
                        float(season['x3p_percent']) if pd.notna(season['x3p_percent']) else 0,
                        float(season['ft_percent']) if pd.notna(season['ft_percent']) else 0,
                        float(season['tov_per_game']) if pd.notna(season['tov_per_game']) else 0
                    ))
            
            except Exception as e:
                logging.error(f"Error processing player {player['player']}: {e}")
                continue
                
        conn.commit()
        logging.info("Data migration completed successfully")
        
    except Exception as e:
        logging.error(f"Migration failed: {e}")
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        logging.error(f"Migration failed: {e}")
        sys.exit(1)