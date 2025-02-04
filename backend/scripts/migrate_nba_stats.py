import sys
import pandas as pd
import sqlite3
import json
import logging
import unicodedata
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Get the correct paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Gets backend folder
DATA_DIR = os.path.join(BASE_DIR, 'data', 'nbastats')  # Path to nbastats folder
APP_DB = os.path.join(BASE_DIR, 'data', 'nba_stats.db')  # Path to database file

def init_database():
    """Initialize the application database."""
    try:
        # Ensure the data directory exists
        os.makedirs(os.path.dirname(APP_DB), exist_ok=True)
        
        logging.info(f"Creating database at: {APP_DB}")
        logging.info(f"Looking for CSV files in: {DATA_DIR}")
        
        # Remove existing database if it exists
        if os.path.exists(APP_DB):
            os.remove(APP_DB)
        
        conn = sqlite3.connect(APP_DB)
        cursor = conn.cursor()
        
        # Create players table
        cursor.execute('''
            CREATE TABLE players (
                id INTEGER PRIMARY KEY,
                full_name TEXT NOT NULL,
                birth_year INTEGER,
                position TEXT,
                team TEXT,
                stats TEXT,
                last_updated DATETIME
            )
        ''')
        
        # Create seasons table with foreign key constraint
        cursor.execute('''
            CREATE TABLE seasons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                season_id TEXT,
                season TEXT,
                team TEXT,
                games INTEGER DEFAULT 0,
                games_started INTEGER DEFAULT 0,
                minutes_per_game REAL DEFAULT 0,
                pts_per_game REAL DEFAULT 0,
                ast_per_game REAL DEFAULT 0,
                reb_per_game REAL DEFAULT 0,
                stl_per_game REAL DEFAULT 0,
                blk_per_game REAL DEFAULT 0,
                fg_percent REAL DEFAULT 0,
                fg3_percent REAL DEFAULT 0,
                ft_percent REAL DEFAULT 0,
                turnover_per_game REAL DEFAULT 0,
                FOREIGN KEY(player_id) REFERENCES players(id)
            )
        ''')
        
        conn.commit()
        logging.info("Database initialized successfully")
        return conn
    except Exception as e:
        logging.error(f"Database initialization error: {e}")
        raise

def safe_float(value, default=0.0):
    try:
        if pd.isna(value):
            return default
        # Remove any % signs and convert to decimal
        if isinstance(value, str):
            value = value.replace('%', '')
        return float(value) / 100 if float(value) > 1 else float(value)
    except (ValueError, TypeError):
        return default

def normalize_name(name):
    """Normalize unicode characters in player names to handle accented characters."""
    # Normalize to NFKD form and encode as ASCII, ignoring non-ASCII characters
    normalized = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore')
    # Decode back to string and convert to lowercase for case-insensitive comparison
    return normalized.decode('ASCII').lower()

def get_player_id_mapping():
    """Create a mapping of player names to their correct IDs."""
    return {
        'Luka Dončić': 4653,  # Use 4653 as the canonical ID for all seasons
        'Dario Šarić': 4389,  # Use 4389 as the canonical ID for all seasons
        'Dāvis Bertāns': 4392,  # Use 4392 as the canonical ID for all seasons
        'Alperen Şengün': 4972,  # Use 4972 as the canonical ID for all seasons
        'Luka Šamanić': 4683,  # Use 4683 as the canonical ID for all seasons
        'Nikola Jokić': 4674,  # Use 4674 as the canonical ID for all seasons
        'Bojan Bogdanović': 4380,  # Use 4380 as the canonical ID for all seasons
        'Bogdan Bogdanović': 4379,  # Use 4379 as the canonical ID for all seasons
        'Goran Dragić': 4391,  # Use 4391 as the canonical ID for all seasons
        'Jusuf Nurkić': 4436,  # Use 4436 as the canonical ID for all seasons
        'Nikola Vučević': 4452,  # Use 4452 as the canonical ID for all seasons
    }

def fix_player_data(per_game_stats):
    """Fix player data by applying correct IDs and handling accented names."""
    # Get the player ID mapping
    player_id_mapping = get_player_id_mapping()
    
    # Create a copy of the dataframe
    fixed_stats = per_game_stats.copy()
    
    # Update player IDs based on the mapping
    for player_name, correct_id in player_id_mapping.items():
        # Find all rows for this player (exact match)
        mask = fixed_stats['player'] == player_name
        # Update the player_id for all matching rows
        fixed_stats.loc[mask, 'player_id'] = correct_id
    
    # Group by player_id, season, and team to get the correct stats
    # For each group, take the row with the highest minutes per game
    fixed_stats = fixed_stats.sort_values('mp_per_game', ascending=False)
    fixed_stats = fixed_stats.groupby(['player_id', 'season', 'player', 'tm']).first().reset_index()
    
    return fixed_stats

def migrate_data():
    try:
        conn = init_database()
        print("Reading CSV files...")
        per_game_stats = pd.read_csv(os.path.join(DATA_DIR, 'Player Per Game.csv'))
        
        # Process and insert each player's data
        print("\nProcessing players...")
        
        # Get unique players and assign a base ID for each player
        players = per_game_stats.sort_values('season', ascending=False).groupby('player').first().reset_index()
        player_base_ids = {player: idx + 10000 for idx, player in enumerate(players['player'])}
        
        # Insert players with their base IDs
        for _, player in players.iterrows():
            try:
                base_id = player_base_ids[player['player']]
                conn.execute('''
                    INSERT INTO players (id, full_name, birth_year, position)
                    VALUES (?, ?, ?, ?)
                ''', (
                    base_id,
                    player['player'],
                    int(player['birth_year']) if pd.notna(player['birth_year']) else None,
                    player['pos']
                ))
            except sqlite3.IntegrityError as e:
                print(f"Error inserting player {player['player']}: {e}")
                continue
        
        # Insert seasons
        print("\nInserting seasons...")
        for _, season in per_game_stats.iterrows():
            try:
                # Convert percentages from string to float
                fg_percent = safe_float(season['fg_percent'])
                fg3_percent = safe_float(season['x3p_percent'])
                ft_percent = safe_float(season['ft_percent'])

                # Use the player's base ID
                base_id = player_base_ids[season['player']]
                conn.execute('''
                    INSERT INTO seasons (
                        player_id, season_id, season, team,
                        games, games_started, minutes_per_game,
                        pts_per_game, ast_per_game, reb_per_game,
                        stl_per_game, blk_per_game,
                        fg_percent, fg3_percent, ft_percent,
                        turnover_per_game
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    base_id,  # Use the base ID for all seasons
                    str(season['season']),
                    str(season['season']),
                    season['tm'],
                    int(season['g']) if pd.notna(season['g']) else 0,
                    int(season['gs']) if pd.notna(season['gs']) else 0,
                    float(season['mp_per_game']) if pd.notna(season['mp_per_game']) else 0,
                    float(season['pts_per_game']) if pd.notna(season['pts_per_game']) else 0,
                    float(season['ast_per_game']) if pd.notna(season['ast_per_game']) else 0,
                    float(season['trb_per_game']) if pd.notna(season['trb_per_game']) else 0,
                    float(season['stl_per_game']) if pd.notna(season['stl_per_game']) else 0,
                    float(season['blk_per_game']) if pd.notna(season['blk_per_game']) else 0,
                    fg_percent,
                    fg3_percent,
                    ft_percent,
                    float(season['tov_per_game']) if pd.notna(season['tov_per_game']) else 0
                ))
            except (sqlite3.IntegrityError, ValueError) as e:
                print(f"Error inserting season for player {season['player']}, season {season['season']}: {e}")
                continue
        
        # Commit all changes
        conn.commit()
        print("Data migration completed successfully")
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    try:
        logging.info("Starting data migration process...")
        migrate_data()
    except Exception as e:
        logging.error(f"Migration failed: {e}")
        sys.exit(1)