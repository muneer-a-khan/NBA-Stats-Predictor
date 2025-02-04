import pandas as pd
import os
import numpy as np

# Get the correct paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'nbastats')
CSV_FILE = os.path.join(DATA_DIR, 'Player Per Game.csv')

def clean_nba_data():
    """Clean NBA data and assign unique IDs for each player's season."""
    print("Reading CSV file...")
    df = pd.read_csv(CSV_FILE)
    
    # Sort by player name, season, and minutes per game (descending)
    df = df.sort_values(['player', 'season', 'mp_per_game'], ascending=[True, True, False])
    
    # For each player and season, keep only the row with the highest minutes per game
    df = df.groupby(['player', 'season']).first().reset_index()
    
    # Create new unique IDs for each player's season
    # Start with a base ID of 10000 to avoid conflicts with existing IDs
    df['new_player_id'] = np.arange(10000, 10000 + len(df))
    
    # Create a backup of the original file
    backup_file = os.path.join(DATA_DIR, 'Player Per Game_backup.csv')
    print(f"Creating backup at {backup_file}...")
    df_original = pd.read_csv(CSV_FILE)
    df_original.to_csv(backup_file, index=False)
    
    # Save the cleaned data
    print("Saving cleaned data...")
    df.to_csv(CSV_FILE, index=False)
    
    # Print some statistics
    print("\nData cleaning statistics:")
    print(f"Total number of player-seasons: {len(df)}")
    print(f"Number of unique players: {df['player'].nunique()}")
    print(f"Seasons covered: {df['season'].min()} to {df['season'].max()}")
    
    # Verify the data for specific players
    def print_player_stats(player_name):
        print(f"\nStats for {player_name}:")
        player_df = df[df['player'] == player_name].sort_values('season')
        if len(player_df) == 0:
            print(f"No data found for {player_name}")
        else:
            print("Season, Team, MPG, PPG, APG, RPG")
            for _, row in player_df.iterrows():
                print(f"{row['season']}, {row['tm']}, {row['mp_per_game']:.1f}, {row['pts_per_game']:.1f}, {row['ast_per_game']:.1f}, {row['trb_per_game']:.1f}")
    
    print("\nVerifying cleaned data for specific players:")
    print_player_stats("Luka Dončić")
    print_player_stats("Dario Šarić")

if __name__ == "__main__":
    clean_nba_data()
