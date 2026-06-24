import os
from functools import lru_cache


class Settings:
    def __init__(self):
        self.APP_NAME = os.getenv("APP_NAME", "医院数据管理系统")
        self.DEBUG = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
        self.SECRET_KEY = os.getenv("SECRET_KEY", "hospital-system-secret-key-2024")
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        self.DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/hospital_system.db")
        
        # 外部 MySQL 配置
        self.MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
        self.MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
        self.MYSQL_USER = os.getenv("MYSQL_USER", "root")
        self.MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "123456")
        self.MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jxks")
        
        # LLM 配置
        self.LLM_API_KEY = os.getenv("LLM_API_KEY", "")
        self.LLM_BASE_URL = os.getenv("LLM_BASE_URL", "")


@lru_cache()
def get_settings():
    return Settings()
