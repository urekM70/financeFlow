import pymysql
import os
import sys
from dotenv import load_dotenv

# Ensure we can import from backend package
# If running from root (python backend/create_db.py), adds root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()
# Also try loading from backend/.env explicitly if it exists
backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path)

from backend.db.database import engine
from backend.db.models import Base

def create_database():
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", 3306))
    db_user = os.getenv("DB_USER", "finance_user")
    db_password = os.getenv("DB_PASSWORD", "your_secure_password")
    db_name = os.getenv("DB_NAME", "finance_db")

    print(f"Connecting to MySQL at {db_host}:{db_port} as {db_user}...")

    # Step 1: Create Database
    try:
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password
        )
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
                print(f"Database '{db_name}' created successfully (or already exists).")
        finally:
            connection.close()
            
    except Exception as e:
        print(f"Error creating database: {e}")
        print("Please check your .env file and ensure MySQL is running.")
        return

    # Step 2: Create Tables
    print("Creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        # If the error is about 'Unknown database', it might be because the engine was initialized 
        # before the DB existed. But create_engine is lazy, so it should be fine as long as 
        # we don't try to connect until create_all. 
        # However, create_engine url includes the db name. 
        # If create_all fails, it might be due to connection issues.

if __name__ == "__main__":
    create_database()
