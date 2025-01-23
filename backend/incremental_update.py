from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import playercareerstats, commonplayerinfo, playerprofilev2
import sqlite3
import json
import time
import logging
from datetime import datetime, timedelta
import asyncio
import aiohttp
from typing import List, Dict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='nba_updates.log'
)

class NBADatabaseUpdater:
    def __init__(self, db_path: str = "nba_stats.db"):
        self.db_path = db_path
        self.active_players_cache = {}
        self.update_interval = timedelta(hours=24)
        self.rate_limit_delay = 1.2  # Seconds between API calls

    async def get_active_players(self) -> List[Dict]:
        """Fetch all currently active NBA players."""
        try:
            all_players = players.get_players()
            active_players = [p for p in all_players if p.get('is_active')]
            return active_players
        except Exception as e:
            logging.error(f"Error fetching active players: {e}")
            return []

    async def fetch_player_stats(self, session: aiohttp.ClientSession, player_id: int):
        """Fetch stats for a single player with rate limiting."""
        try:
            async with session.get(f"https://stats.nba.com/stats/playercareerstats?PlayerID={player_id}") as response:
                data = await response.json()
                await asyncio.sleep(self.rate_limit_delay)
                return data
        except Exception as e:
            logging.error(f"Error fetching stats for player {player_id}: {e}")
            return None

    async def needs_update(self, cursor, player_id: int) -> bool:
        """Check if a player needs to be updated based on last update time."""
        cursor.execute(
            "SELECT last_updated FROM players WHERE id = ?",
            (player_id,)
        )
        result = cursor.fetchone()
        
        if not result:
            return True
        
        last_updated = datetime.strptime(result[0], '%Y-%m-%d %H:%M:%S')
        return datetime.now() - last_updated > self.update_interval

    async def update_player(self, conn, player: Dict):
        """Update a single player's information and stats."""
        try:
            cursor = conn.cursor()
            
            if not await self.needs_update(cursor, player['id']):
                return False

            # Fetch current player info
            player_info = commonplayerinfo.CommonPlayerInfo(player_id=player['id'])
            time.sleep(self.rate_limit_delay)
            
            # Fetch detailed stats
            career_stats = playercareerstats.PlayerCareerStats(player_id=player['id'])
            time.sleep(self.rate_limit_delay)

            # Get current season averages
            profile = playerprofilev2.PlayerProfileV2(player_id=player['id'])
            time.sleep(self.rate_limit_delay)

            # Prepare player data
            stats_data = {
                'current_season': profile.get_normalized_dict().get('SeasonAverages', [{}])[0],
                'career_stats': career_stats.get_normalized_dict().get('CareerTotalsRegularSeason', [{}])[0],
                'career_totals': career_stats.get_normalized_dict().get('CareerTotalsRegularSeason', [{}])[0]
            }

            # Update database
            cursor.execute("""
                INSERT OR REPLACE INTO players 
                (id, full_name, team, position, jersey_number, stats, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                player['id'],
                player['full_name'],
                player_info.get_normalized_dict().get('CommonPlayerInfo', [{}])[0].get('TEAM_NAME', 'N/A'),
                player_info.get_normalized_dict().get('CommonPlayerInfo', [{}])[0].get('POSITION', 'N/A'),
                player_info.get_normalized_dict().get('CommonPlayerInfo', [{}])[0].get('JERSEY', 'N/A'),
                json.dumps(stats_data)
            ))

            conn.commit()
            return True

        except Exception as e:
            logging.error(f"Error updating player {player['full_name']}: {e}")
            conn.rollback()
            return False

    async def run_incremental_update(self):
        """Run the incremental update process."""
        try:
            conn = sqlite3.connect(self.db_path)
            active_players = await self.get_active_players()
            
            logging.info(f"Starting incremental update for {len(active_players)} active players")
            
            updated_count = 0
            for player in active_players:
                if await self.update_player(conn, player):
                    updated_count += 1
                    logging.info(f"Updated {player['full_name']}")
                await asyncio.sleep(self.rate_limit_delay)

            logging.info(f"Incremental update complete. Updated {updated_count} players")

        except Exception as e:
            logging.error(f"Error in incremental update: {e}")
        finally:
            conn.close()

    def setup_database(self):
        """Ensure database tables exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY,
                full_name TEXT,
                team TEXT,
                position TEXT,
                jersey_number TEXT,
                stats TEXT,
                last_updated DATETIME
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                player_id INTEGER PRIMARY KEY,
                data TEXT,
                last_updated DATETIME
            )
        """)
        
        conn.commit()
        conn.close()

async def main():
    updater = NBADatabaseUpdater()
    updater.setup_database()
    await updater.run_incremental_update()

if __name__ == "__main__":
    asyncio.run(main())