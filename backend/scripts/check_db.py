import sqlite3

def check_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("\nAvailable tables:")
    for table in tables:
        print(f"- {table[0]}")
        
        # Check schema for each table
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        print("  Columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Check row count
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"  Row count: {count}\n")

    conn.close()

if __name__ == "__main__":
    # Check source database
    print("Checking Kaggle database (nba.sqlite):")
    check_database("../data/nba.sqlite")