import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "hospital_system.db")

def migrate_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 检查 avatar 列是否已存在
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "avatar" not in columns:
            print("Adding 'avatar' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT ''")
            print("Successfully added 'avatar' column!")
        
        if "updated_at" not in columns:
            print("Adding 'updated_at' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME")
            print("Successfully added 'updated_at' column!")
            
            # 用当前时间填充现有记录的 updated_at
            cursor.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
        
        conn.commit()
        print("Database migration completed!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
