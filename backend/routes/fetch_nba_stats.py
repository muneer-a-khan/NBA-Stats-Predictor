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
from fake_useragent import UserAgent
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='nba_data_fetch.log'
)

DB_FILE = "nba_stats.db"
PROGRESS_FILE = "fetch_progress.json"
DAILY_LIMIT = 300

class NBAAPIHandler:
    def __init__(self):
        self.user_agent = UserAgent()
        self.requests_made = 0
        self.max_requests = 50
        self.reset_interval = 300
        self.last_request_time = datetime.now()

    def get_headers(self):
        return {
            'User-Agent': self.user_agent.random,
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Host': 'stats.nba.com',
            'Origin': 'https://www.nba.com',
            'Referer': 'https://www.nba.com/',
        }

    def should_reset_counter(self):
        time_since_last = (datetime.now() - self.last_request_time).total_seconds()
        return time_since_last >= self.reset_interval

    def handle_rate_limit(self):
        if self.requests_made >= self.max_requests:
            wait_time = random.uniform(self.reset_interval, self.reset_interval * 1.5)
            logging.info(f"Rate limit approached. Waiting {wait_time:.2f} seconds...")
            time.sleep(wait_time)
            self.requests_made = 0
            self.last_request_time = datetime.now()

class ProgressTracker:
    def __init__(self):
        self.progress_file = PROGRESS_FILE
        self.load_progress()

    def load_progress(self):
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                data = json.load(f)
                self.last_processed_id = data.get('last_processed_id', 0)
                self.daily_count = data.get('daily_count', 0)
                self.last_update_date = data.get('last_update_date', None)
        else:
            self.last_processed_id = 0
            self.daily_count = 0
            self.last_update_date = None

        # Reset daily count if it's a new day
        current_date = datetime.now().strftime('%Y-%m-%d')
        if self.last_update_date != current_date:
            self.daily_count = 0
            self.last_update_date = current_date

    def save_progress(self):
        with open(self.progress_file, 'w') as f:
            json.dump({
                'last_processed_id': self.last_processed_id,
                'daily_count': self.daily_count,
                'last_update_date': self.last_update_date
            }, f)

    def update_progress(self, player_id):
        self.last_processed_id = player_id
        self.daily_count += 1
        self.save_progress()

    def should_wait_for_next_day(self):
        return self.daily_count >= DAILY_LIMIT

def create_connection():
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {e}")
        raise

def init_database(conn):
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

def fetch_with_retry(player_id, api_handler, max_retries=7):
    """Fetch player stats with enhanced retry logic."""
    api_handler.handle_rate_limit()
    
    for attempt in range(max_retries):
        try:
            headers = api_handler.get_headers()
            
            career_stats = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                timeout=120,
                headers=headers
            )
            
            api_handler.requests_made += 1
            base_delay = random.uniform(15, 25)
            extra_delay = attempt * 5
            total_delay = base_delay + extra_delay
            logging.info(f"Successful request. Waiting {total_delay:.2f} seconds before next request...")
            time.sleep(total_delay)
            
            return career_stats.get_data_frames()[0]
            
        except Exception as e:
            base_wait = 30
            wait_time = (base_wait * (3 ** attempt)) + random.uniform(10, 20)
            
            if "timeout" in str(e).lower():
                wait_time *= 2
            
            logging.warning(f"Attempt {attempt + 1} failed for player {player_id}. "
                          f"Waiting {wait_time:.2f} seconds. Error: {str(e)}")
            
            time.sleep(wait_time)
            
            if attempt == max_retries - 1:
                logging.info("Final attempt with fresh connection...")
                api_handler = NBAAPIHandler()

def get_player_info(player_id, api_handler, max_retries=7):
    api_handler.handle_rate_limit()
    
    for attempt in range(max_retries):
        try:
            headers = api_handler.get_headers()
            player_info = commonplayerinfo.CommonPlayerInfo(
                player_id=player_id,
                timeout=120,
                headers=headers
            )
            
            api_handler.requests_made += 1
            time.sleep(random.uniform(10, 15))
            
            return player_info.get_data_frames()[0].iloc[0]
        except Exception as e:
            wait_time = (30 * (3 ** attempt)) + random.uniform(5, 10)
            time.sleep(wait_time)
            if attempt == max_retries - 1:
                logging.error(f"Failed to fetch info for player {player_id}: {str(e)}")
                return None

def save_player_data(conn, player_data):
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

def process_players():
    conn = create_connection()
    init_database(conn)
    api_handler = NBAAPIHandler()
    progress = ProgressTracker()
    
    try:
        all_players = players.get_players()
        remaining_players = [p for p in all_players if p['id'] > progress.last_processed_id]
        
        if not remaining_players:
            logging.info("All players processed!")
            return True

        total_players = len(all_players)
        logging.info(f"Starting to fetch data for {total_players} players")
        
        batch_size = 2
        for i in range(0, len(remaining_players), batch_size):
            if progress.should_wait_for_next_day():
                next_run = datetime.now() + timedelta(days=1)
                next_run = next_run.replace(hour=0, minute=0, second=0, microsecond=0)
                wait_time = (next_run - datetime.now()).total_seconds()
                logging.info(f"Daily limit reached. Waiting until {next_run} to resume...")
                time.sleep(wait_time)
                progress = ProgressTracker()  # Reset progress for new day
                continue

            batch = remaining_players[i:i+batch_size]
            
            for player in batch:
                try:
                    processed_count = i + progress.daily_count
                    logging.info(f"Processing player {processed_count + 1}/{total_players}: {player['full_name']}")
                    
                    stats_df = fetch_with_retry(player['id'], api_handler)
                    if stats_df.empty:
                        continue

                    stats_records = stats_df.to_dict('records')
                    player_info = get_player_info(player['id'], api_handler)

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
                    progress.update_progress(player['id'])
                    logging.info(f"Successfully saved data for {player['full_name']}")
                    
                except Exception as e:
                    logging.error(f"Error processing player {player['full_name']}: {str(e)}")
                    continue

            batch_delay = random.uniform(45, 60)
            logging.info(f"Completed batch. Waiting {batch_delay:.2f} seconds before next batch...")
            time.sleep(batch_delay)

        return True

    except Exception as e:
        logging.error(f"Fatal error in process_players: {str(e)}")
        raise
    finally:
        conn.close()

def run_with_auto_resume():
    while True:
        try:
            completed = process_players()
            if completed:
                logging.info("All players processed successfully!")
                break
        except Exception as e:
            logging.error(f"Error in main loop: {str(e)}")
            wait_time = 3600
            logging.info(f"Waiting {wait_time} seconds before retrying...")
            time.sleep(wait_time)

if __name__ == "__main__":
    try:
        run_with_auto_resume()
    except KeyboardInterrupt:
        logging.info("Script manually interrupted. Will resume from last processed player when restarted.")
        sys.exit(0)
    except Exception as e:
        logging.error(f"Fatal error: {str(e)}")
        sys.exit(1)