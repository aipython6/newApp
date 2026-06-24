import pymysql
from typing import Optional, Dict, Any, List, Tuple
from config import get_settings

settings = get_settings()

# 可选导入数据库驱动
try:
    import oracledb
    # oracledb 默认使用轻量模式（thin mode），不需要 Oracle Client 库
    ORACLE_AVAILABLE = True
except ImportError:
    ORACLE_AVAILABLE = False
    print("⚠️  Oracle 驱动 (oracledb) 未安装，Oracle 数据库功能将不可用")

try:
    import pyodbc
    SQLSERVER_AVAILABLE = True
except ImportError:
    SQLSERVER_AVAILABLE = False
    print("⚠️  SQL Server 驱动 (pyodbc) 未安装，SQL Server 功能将不可用")


def test_mysql_connection(host: str, port: int, database: str, username: str, password: str) -> Tuple[bool, str]:
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database,
            connect_timeout=10
        )
        conn.close()
        return True, "连接成功"
    except Exception as e:
        return False, str(e)


def test_oracle_connection(host: str, port: int, database: str, username: str, password: str) -> Tuple[bool, str]:
    if not ORACLE_AVAILABLE:
        return False, "Oracle 驱动未安装，请安装 oracledb 包"
    try:
        dsn = oracledb.makedsn(host, port, service_name=database)
        conn = oracledb.connect(user=username, password=password, dsn=dsn)
        conn.close()
        return True, "连接成功"
    except Exception as e:
        return False, str(e)


def test_sqlserver_connection(host: str, port: int, database: str, username: str, password: str) -> Tuple[bool, str]:
    if not SQLSERVER_AVAILABLE:
        return False, "SQL Server 驱动未安装，请安装 pyodbc 包"
    try:
        conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={host},{port};DATABASE={database};UID={username};PWD={password}"
        conn = pyodbc.connect(conn_str)
        conn.close()
        return True, "连接成功"
    except Exception as e:
        return False, str(e)


def test_oceanbase_connection(host: str, port: int, database: str, username: str, password: str) -> Tuple[bool, str]:
    return test_mysql_connection(host, port, database, username, password)


def test_starrocks_connection(host: str, port: int, database: str, username: str, password: str) -> Tuple[bool, str]:
    return test_mysql_connection(host, port, database, username, password)


def test_connection(db_type: str, host: str, port: int, database: str, username: Optional[str] = None,
                   password: Optional[str] = None) -> Tuple[bool, str]:
    test_functions = {
        "mysql8": test_mysql_connection,
        "mysql5.7": test_mysql_connection,
        "oracle11g": test_oracle_connection,
        "oracle9c": test_oracle_connection,
        "sqlserver2008": test_sqlserver_connection,
        "oceanbase": test_oceanbase_connection,
        "starrocks": test_starrocks_connection
    }

    test_func = test_functions.get(db_type)
    if not test_func:
        return False, f"不支持的数据库类型: {db_type}"

    return test_func(host, port, database, username or "", password or "")


def get_mysql_tables(host: str, port: int, database: str, username: str, password: str) -> List[str]:
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return tables
    except Exception as e:
        return []


def get_mysql_columns(host: str, port: int, database: str, username: str, password: str, table: str) -> List[Dict[str, Any]]:
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        cursor.execute(f"DESCRIBE {table}")
        columns = []
        for row in cursor.fetchall():
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "key": row[3],
                "default": row[4],
                "extra": row[5]
            })
        cursor.close()
        conn.close()
        return columns
    except Exception as e:
        return []


def get_jxks_db_connection():
    return pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE
    )


def execute_sql(host: str, port: int, database: str, username: str, password: str, sql: str) -> Tuple[bool, str]:
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()
        cursor.close()
        conn.close()
        return True, "执行成功"
    except Exception as e:
        return False, str(e)
