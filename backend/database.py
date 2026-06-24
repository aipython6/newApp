from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, Session
from config import get_settings
import sqlite3
import os

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_sqlite():
    """SQLite specific migration to add missing columns"""
    if "sqlite" not in settings.DATABASE_URL:
        return
    
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 检查现有列
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "avatar" not in columns:
            print("Migrating: Adding 'avatar' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT ''")
            conn.commit()
        
        if "updated_at" not in columns:
            print("Migrating: Adding 'updated_at' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME")
            # 用创建时间填充更新时间
            cursor.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
            conn.commit()
            
    except Exception as e:
        print(f"Migration warning: {e}")
    finally:
        conn.close()


def init_db():
    from models import Base
    Base.metadata.create_all(bind=engine)
    # 自动执行 SQLite 迁移
    migrate_sqlite()
