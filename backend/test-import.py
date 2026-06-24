#!/usr/bin/env python3
"""
测试导入是否正常
"""

print("🔍 测试导入...")

try:
    import pymysql
    print("✅ pymysql 导入成功")
except Exception as e:
    print(f"❌ pymysql 导入失败: {e}")

try:
    from db_service import test_connection
    print("✅ db_service 导入成功")
except Exception as e:
    print(f"❌ db_service 导入失败: {e}")
    import traceback
    traceback.print_exc()

try:
    from config import get_settings
    print("✅ config 导入成功")
except Exception as e:
    print(f"❌ config 导入失败: {e}")

try:
    from models import Base
    print("✅ models 导入成功")
except Exception as e:
    print(f"❌ models 导入失败: {e}")

try:
    from database import init_db
    print("✅ database 导入成功")
except Exception as e:
    print(f"❌ database 导入失败: {e}")

print()
print("🎉 基础导入测试完成！")
