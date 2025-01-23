from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats, commonplayerinfo
import sys
import json
import sqlite3
import time
import math
import random
from requests.exceptions import RequestException, Timeout, ConnectionError
import logging
from datetime import datetime, timedelta
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='nba_data_fetch.log'
)

DB_FILE = "nba_stats.db"
REQUEST_COUNTER_FILE = "request_counter.json"
DAILY_LIMIT = 300  # Set limit to 300 players per day

class RequestCounter:
    def __init__(self):
        self.counter_file = REQUEST_COUNTER_FILE
        self.load_counter()

    def load_counter(self):
        if os.path.exists(self.counter_file):
            with open(self.counter_file, 'r') as f:
                data = json.load(f)
                self.date = data.get('date')
                self.count = data.get('count', 0)
                # Don't reset if it's the same day
                if self.date != datetime.now().strftime('%Y-%m-%d'):
                    self.reset()
        else:
            # If no counter file exists, assume we've hit the limit today
            # since you've already fetched 300 players
            self.date = datetime.now().strftime('%Y-%m-%d')
            self.count = DAILY_LIMIT
            self.save()

    def reset(self):
        self.date = datetime.now().strftime('%Y-%m-%d')
        self.count = 0
        self.save()

    def increment(self):
        self.count += 1
        self.save()

    def save(self):
        with open(self.counter_file, 'w') as f:
            json.dump({
                'date': self.date,
                'count': self.count
            }, f)

    def should_pause(self):
        return self.count >= DAILY_LIMIT

def create_connection():
    """Create a database connection."""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {e}")
        raise

def init_database(conn):
    """Initialize database tables."""
    try:
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY,
                full_name TEXT,
                team TEXT,
                position TEXT,
                jersey_number TEXT,
                stats TEXT,
                last_updated DATETIME
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS seasons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                season_id TEXT,
                team_abbreviation TEXT,
                gp INTEGER,
                min REAL,
                pts REAL,
                ast REAL,
                reb REAL,
                stl REAL,
                blk REAL,
                fg_pct REAL,
                fg3_pct REAL,
                ft_pct REAL,
                FOREIGN KEY(player_id) REFERENCES players(id)
            )
        ''')
        
        conn.commit()
    except sqlite3.Error as e:
        logging.error(f"Database initialization error: {e}")
        raise

def fetch_with_retry(player_id, request_counter, max_retries=5, base_delay=10):
    """Fetch player stats with exponential backoff retry."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for attempt in range(max_retries):
        try:
            if request_counter.should_pause():
                return "DAILY_LIMIT_REACHED"

            jitter = random.uniform(0, 4)
            current_delay = (base_delay * (2 ** attempt)) + jitter
            
            career_stats = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                timeout=90,
                headers=headers
            )
            request_counter.increment()
            time.sleep(current_delay)
            return career_stats.get_data_frames()[0]
            
        except Exception as e:
            wait_time = current_delay * 2
            logging.warning(f"Attempt {attempt + 1} failed for player {player_id}. Waiting {wait_time:.2f} seconds. Error: {str(e)}")
            
            if attempt == max_retries - 1:
                raise
            
            if "too many requests" in str(e).lower() or "connection" in str(e).lower():
                wait_time *= 2
            
            time.sleep(wait_time)

def get_player_info(player_id, request_counter, max_retries=5):
    """Fetch additional player information."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for attempt in range(max_retries):
        try:
            if request_counter.should_pause():
                return None

            player_info = commonplayerinfo.CommonPlayerInfo(
                player_id=player_id,
                timeout=60,
                headers=headers
            )
            request_counter.increment()
            time.sleep(random.uniform(3, 5))
            return player_info.get_data_frames()[0].iloc[0]
        except Exception as e:
            wait_time = 5 * (2 ** attempt) + random.uniform(0, 2)
            time.sleep(wait_time)
            if attempt == max_retries - 1:
                logging.error(f"Failed to fetch info for player {player_id}: {str(e)}")
                return None

def save_player_data(conn, player_data):
    """Save player data to database."""
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO players 
            (id, full_name, team, position, jersey_number, stats, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ''', (
            player_data['id'],
            player_data['full_name'],
            player_data.get('team', 'N/A'),
            player_data.get('position', 'N/A'),
            player_data.get('jersey_number', 'N/A'),
            json.dumps(player_data['stats'])
        ))

        if 'seasons' in player_data:
            for season in player_data['seasons']:
                cursor.execute('''
                    INSERT OR REPLACE INTO seasons
                    (player_id, season_id, team_abbreviation, gp, min, pts, ast, reb, stl, blk, fg_pct, fg3_pct, ft_pct)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    player_data['id'],
                    season['SEASON_ID'],
                    season.get('TEAM_ABBREVIATION', 'N/A'),
                    season.get('GP', 0),
                    season.get('MIN', 0),
                    season.get('PTS', 0),
                    season.get('AST', 0),
                    season.get('REB', 0),
                    season.get('STL', 0),
                    season.get('BLK', 0),
                    season.get('FG_PCT', 0),
                    season.get('FG3_PCT', 0),
                    season.get('FT_PCT', 0)
                ))
        
        conn.commit()
    except sqlite3.Error as e:
        logging.error(f"Error saving player {player_data['full_name']}: {e}")
        conn.rollback()
        raise

def process_players(remaining_time=None):
    """Process players with automatic resumption."""
    conn = create_connection()
    init_database(conn)
    request_counter = RequestCounter()
    
    try:
        all_players = players.get_players()
        
        # Get last processed player
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(id) FROM players")
        last_id = cursor.fetchone()[0] or 0
        
        # Filter players not yet processed
        remaining_players = [p for p in all_players if p['id'] > last_id]
        
        if not remaining_players:
            logging.info("All players processed!")
            return True  # Completed
            
        logging.info(f"Starting/Resuming processing of {len(remaining_players)} remaining players")
        
        chunk_size = 3
        for i in range(0, len(remaining_players), chunk_size):
            chunk = remaining_players[i:i+chunk_size]
            
            for player in chunk:
                try:
                    logging.info(f"Processing player {i+1}/{len(remaining_players)}: {player['full_name']}")
                    
                    # Check daily limit
                    if request_counter.should_pause():
                        logging.info("Daily limit reached. Scheduling resume for tomorrow.")
                        return False  # Not completed, need to resume
                        
                    stats_df = fetch_with_retry(player['id'], request_counter)
                    if stats_df == "DAILY_LIMIT_REACHED":
                        return False
                    
                    if stats_df.empty:
                        continue

                    stats_records = stats_df.to_dict('records')
                    player_info = get_player_info(player['id'], request_counter)

                    player_data = {
                        'id': player['id'],
                        'full_name': player['full_name'],
                        'team': player_info['TEAM_NAME'] if player_info is not None else 'N/A',
                        'position': player_info['POSITION'] if player_info is not None else 'N/A',
                        'jersey_number': player_info['JERSEY'] if player_info is not None else 'N/A',
                        'stats': stats_records[0] if stats_records else {},
                        'seasons': stats_records
                    }

                    save_player_data(conn, player_data)
                    logging.info(f"Successfully saved data for {player['full_name']}")
                    
                    time.sleep(random.uniform(8, 12))

                except Exception as e:
                    logging.error(f"Error processing player {player['full_name']}: {str(e)}")
                    continue
            
            chunk_delay = random.uniform(15, 25)
            logging.info(f"Completed chunk. Waiting {chunk_delay:.2f} seconds before next chunk...")
            time.sleep(chunk_delay)

        return True  # Completed all players

    except Exception as e:
        logging.error(f"Fatal error in process_players: {str(e)}")
        raise
    finally:
        conn.close()

def run_with_auto_resume():
    """Main function that handles automatic resumption."""
    while True:
        try:
            # First check if we've already hit the limit today
            request_counter = RequestCounter()
            if request_counter.should_pause():
                next_run = datetime.now() + timedelta(days=1)
                next_run = next_run.replace(hour=0, minute=0, second=0, microsecond=0)
                wait_time = (next_run - datetime.now()).total_seconds()
                
                logging.info(f"Already processed {DAILY_LIMIT} players today. Waiting until {next_run} to resume...")
                print(f"Already processed {DAILY_LIMIT} players today. Will resume at midnight. You can safely leave this running.")
                time.sleep(wait_time)
                request_counter.reset()
                continue

            completed = process_players()
            if completed:
                logging.info("All players processed successfully!")
                break
            else:
                next_run = datetime.now() + timedelta(days=1)
                next_run = next_run.replace(hour=0, minute=0, second=0, microsecond=0)
                wait_time = (next_run - datetime.now()).total_seconds()
                
                logging.info(f"Daily limit reached. Waiting until {next_run} to resume...")
                print(f"Daily limit reached. Will resume at midnight. You can safely leave this running.")
                time.sleep(wait_time)
                request_counter.reset()
                
        except Exception as e:
            logging.error(f"Error in main loop: {str(e)}")
            # Wait 1 hour before retrying on error
            time.sleep(3600)

if __name__ == "__main__":
    try:
        run_with_auto_resume()
    except KeyboardInterrupt:
        logging.info("Script manually interrupted. Will resume from last processed player when restarted.")
        sys.exit(0)
    except Exception as e:
        logging.error(f"Fatal error: {str(e)}")
        sys.exit(1)