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
        
        conn = sqlite3.connect(APP_DB)
        cursor = conn.cursor()
        
        # Drop existing tables
        cursor.execute('DROP TABLE IF EXISTS seasons')
        cursor.execute('DROP TABLE IF EXISTS players')
        
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
        
        # Create seasons table
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

def check_existing_data(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM players")
    count = cursor.fetchone()[0]
    return count > 0

def safe_float(value, default=0.0):
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def verify_and_fix_player_seasons(per_game_stats):
    """Verify and fix player seasons data."""
    # Sort by player_id and season
    per_game_stats = per_game_stats.sort_values(['player_id', 'season'])
    
    # Group by player_id to check for data consistency
    for player_id in per_game_stats['player_id'].unique():
        player_data = per_game_stats[per_game_stats['player_id'] == player_id]
        player_name = player_data.iloc[0]['player']
        
        # Log player career data for verification
        logging.info(f"\nVerifying {player_name} (ID: {player_id}) career data:")
        for _, season in player_data.iterrows():
            logging.info(f"""
            Season: {season['season']}
            Team: {season['tm']}
            Games: {season['g']}
            PPG: {season['pts_per_game']}
            APG: {season['ast_per_game']}
            RPG: {season['trb_per_game']}
            FG%: {season['fg_percent']}
            """)
    
    return per_game_stats

# def analyze_lebron_data(per_game_stats):
#     """Analyze LeBron's data in detail before migration."""
#     lebron_data = per_game_stats[per_game_stats['player'] == 'LeBron James']
   
#    if not lebron_data.empty:
#        logging.info("\nLeBron James raw data from CSV:")
#        lebron_sorted = lebron_data.sort_values('season')
#        for _, season in lebron_sorted.iterrows():
#            logging.info(f"""
#            Season: {season['season']}
#            Team: {season['tm']}
#            PlayerID: {season['player_id']}
#            Games: {season['g']}
#            PPG: {season['pts_per_game']}
#            APG: {season['ast_per_game']}
#            RPG: {season['trb_per_game']}
#            """)
#    else:
#        logging.info("No data found for LeBron James")
#    
#    return lebron_data

def detect_duplicate_ids(per_game_stats):
    """Detect players with duplicate IDs and analyze their data."""
    # Get current players (playing in 2024 or 2025)
    current_seasons = per_game_stats[per_game_stats['season'].astype(int) >= 2024]
    current_players = current_seasons['player'].unique()
    
    duplicates = []
    for player in current_players:
        player_data = per_game_stats[per_game_stats['player'] == player]
        player_ids = player_data['player_id'].unique()
        
        if len(player_ids) > 1:
            # Get earliest and latest season for each ID
            id_info = {}
            for pid in player_ids:
                pid_data = player_data[player_data['player_id'] == pid]
                id_info[pid] = {
                    'min_season': pid_data['season'].astype(int).min(),
                    'max_season': pid_data['season'].astype(int).max()
                }
            
            duplicates.append({
                'player': player,
                'ids': player_ids,
                'id_info': id_info
            })
    
    # Log findings
    logging.info("\nPlayers with duplicate IDs:")
    for dup in duplicates:
        logging.info(f"\nPlayer: {dup['player']}")
        for pid in dup['ids']:
            info = dup['id_info'][pid]
            logging.info(f"ID {pid}: Seasons {info['min_season']}-{info['max_season']}")
    
    return duplicates

def create_id_mappings(duplicates):
    """Create ID mappings for players with duplicates."""
    mappings = {}
    for dup in duplicates:
        # Get the ID used in the most recent seasons
        latest_id = None
        latest_season = 0
        for pid in dup['ids']:
            if dup['id_info'][pid]['max_season'] > latest_season:
                latest_season = dup['id_info'][pid]['max_season']
                latest_id = pid
        
        # Map other IDs to the latest ID
        for pid in dup['ids']:
            if pid != latest_id:
                mappings[pid] = {
                    'new_id': latest_id,
                    'split_season': 2024  # Use 2024 as the split point
                }
    
    return mappings

def merge_player_ids(per_game_stats):
    """Merge data for players with multiple IDs and remove duplicates."""
    # Detect duplicates and create mappings
    duplicates = detect_duplicate_ids(per_game_stats)
    id_mappings = create_id_mappings(duplicates)
    
    # Add known mappings (like LeBron)
    id_mappings[3463] = {
        'new_id': 3462,
        'split_season': 2024
    }
    
    # Create a copy of the dataframe
    fixed_stats = per_game_stats.copy()
    
    # Update player_ids based on mappings
    for old_id, mapping in id_mappings.items():
        new_id = mapping['new_id']
        split_season = mapping['split_season']
        
        # Get all rows for the player (both IDs)
        old_id_mask = fixed_stats['player_id'] == old_id
        new_id_mask = fixed_stats['player_id'] == new_id
        
        # Keep old ID data for seasons before split_season
        valid_old_data = fixed_stats[
            old_id_mask & (fixed_stats['season'].astype(int) < split_season)
        ]
        
        # Keep new ID data for split_season and after
        valid_new_data = fixed_stats[
            new_id_mask & (fixed_stats['season'].astype(int) >= split_season)
        ]
        
        # Remove all rows with old and new IDs
        fixed_stats = fixed_stats[~(old_id_mask | new_id_mask)]
        
        # Add back the valid data
        fixed_stats = pd.concat([fixed_stats, valid_old_data, valid_new_data])
        
        # Update the player_id for the old valid data to the new ID
        fixed_stats.loc[fixed_stats['player_id'] == old_id, 'player_id'] = new_id
    
    # Sort the dataframe
    fixed_stats = fixed_stats.sort_values(['player_id', 'season'])
    
    # Log LeBron's data after fixing
    lebron_data = fixed_stats[fixed_stats['player'] == 'LeBron James'].sort_values('season')
    logging.info("\nLeBron's data after merging:")
    for _, season in lebron_data.iterrows():
        logging.info(f"""
        Season: {season['season']}
        Team: {season['tm']}
        PlayerID: {season['player_id']}
        Games: {season['g']}
        PPG: {season['pts_per_game']}
        APG: {season['ast_per_game']}
        RPG: {season['trb_per_game']}
        """)
    
    return fixed_stats

def migrate_data():
    try:
        conn = init_database()
        
        logging.info("Reading CSV files...")
        per_game_stats = pd.read_csv(os.path.join(DATA_DIR, 'Player Per Game.csv'))
        
        # Fix player IDs before migration
        per_game_stats = merge_player_ids(per_game_stats)
        
        # Verify LeBron's data after fixing IDs
        lebron_data = per_game_stats[per_game_stats['player'] == 'LeBron James'].sort_values('season')
        logging.info("\nVerifying LeBron's data after ID merge:")
        for _, season in lebron_data.iterrows():
            logging.info(f"""
            Season: {season['season']}
            Team: {season['tm']}
            PlayerID: {season['player_id']}
            Games: {season['g']}
            PPG: {season['pts_per_game']}
            APG: {season['ast_per_game']}
            RPG: {season['trb_per_game']}
            """)
        
        # Group players by their unique ID
        player_groups = per_game_stats.groupby('player_id')
        
        cursor = conn.cursor()
        logging.info("Processing players...")
        
        for player_id, player_seasons in player_groups:
            try:
                # Sort seasons chronologically
                player_seasons = player_seasons.sort_values('season')
                latest_season = player_seasons.iloc[-1]
                
                # Insert player
                cursor.execute('''
                    INSERT INTO players (id, full_name, birth_year, position, team, stats, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                ''', (
                    int(player_id),
                    latest_season['player'],
                    int(latest_season['birth_year']) if pd.notna(latest_season['birth_year']) else None,
                    latest_season['pos'],
                    latest_season['tm'],
                    json.dumps({
                        'games': int(latest_season['g']) if pd.notna(latest_season['g']) else 0,
                        'points': float(latest_season['pts_per_game']) if pd.notna(latest_season['pts_per_game']) else 0,
                        'assists': float(latest_season['ast_per_game']) if pd.notna(latest_season['ast_per_game']) else 0,
                        'rebounds': float(latest_season['trb_per_game']) if pd.notna(latest_season['trb_per_game']) else 0,
                        'steals': float(latest_season['stl_per_game']) if pd.notna(latest_season['stl_per_game']) else 0,
                        'blocks': float(latest_season['blk_per_game']) if pd.notna(latest_season['blk_per_game']) else 0,
                        'fg_percent': float(latest_season['fg_percent']) if pd.notna(latest_season['fg_percent']) else 0,
                        'fg3_percent': float(latest_season['x3p_percent']) if pd.notna(latest_season['x3p_percent']) else 0,
                        'ft_percent': float(latest_season['ft_percent']) if pd.notna(latest_season['ft_percent']) else 0
                    })
                ))
                
                # Insert each season
                for _, season in player_seasons.iterrows():
                    cursor.execute('''
                        INSERT INTO seasons (
                            player_id, season_id, season, team, games, games_started,
                            minutes_per_game, pts_per_game, ast_per_game,
                            reb_per_game, stl_per_game, blk_per_game,
                            fg_percent, fg3_percent, ft_percent, turnover_per_game
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        int(player_id),  # Use the new player_id consistently
                        f"{season['season']}_{season['tm']}",
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
                        float(season['fg_percent']) if pd.notna(season['fg_percent']) else 0,
                        float(season['x3p_percent']) if pd.notna(season['x3p_percent']) else 0,
                        float(season['ft_percent']) if pd.notna(season['ft_percent']) else 0,
                        float(season['tov_per_game']) if pd.notna(season['tov_per_game']) else 0
                    ))
            
            except Exception as e:
                logging.error(f"Error processing player ID {player_id}: {str(e)}")
                continue
        
        conn.commit()
        logging.info("Data migration completed successfully")
        
    except Exception as e:
        logging.error(f"Migration failed: {str(e)}")
        raise
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