import pandas as pd
import os
import logging

logging.basicConfig(level=logging.INFO)

def analyze_dataset(base_path):
    """Analyze the structure of the Kaggle dataset files."""
    try:
        # Player files mapped to their actual CSV filenames
        player_files = {
            'totals': 'Player Totals.csv',
            'per_game': 'Player Per Game.csv',
            'per_36': 'Per 36 Minutes.csv',
            'advanced': 'Advanced.csv',
            'info': 'Player Career Info.csv'
        }

        for name, file_name in player_files.items():
            file_path = os.path.join(base_path, file_name)
            if not os.path.exists(file_path):
                logging.error(f"File not found: {file_path}")
                continue  # Skip this file if it doesn't exist
            
            # Read the CSV file
            df = pd.read_csv(file_path)
            print(f"\nAnalyzing {name}:")
            print("Columns:", df.columns.tolist())
            print("Sample data:")
            print(df.head(2))
            print("Number of records:", len(df))

    except Exception as e:
        logging.error(f"Error analyzing dataset: {str(e)}")

if __name__ == "__main__":
    # Update this path to where your Kaggle dataset is downloaded
    dataset_path = "C:/Users/munee/OneDrive/Desktop/NFL-NBA-Stats-Predictor/backend/data/nbastats"
    analyze_dataset(dataset_path)
