import schedule
import time
import subprocess
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='update_scheduler.log'
)

def run_migration():
    try:
        logging.info("Starting scheduled data update")
        subprocess.run(['python', 'migrate_kaggle_data.py'], check=True)
        logging.info("Scheduled update completed successfully")
    except subprocess.CalledProcessError as e:
        logging.error(f"Update failed: {str(e)}")

def schedule_updates():
    # Schedule daily update at 3 AM
    schedule.every().day.at("03:00").do(run_migration)
    
    logging.info("Update scheduler started")
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    try:
        schedule_updates()
    except KeyboardInterrupt:
        logging.info("Scheduler stopped by user")
    except Exception as e:
        logging.error(f"Scheduler error: {str(e)}")