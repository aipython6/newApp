#!/usr/bin/env python3
"""
后端启动脚本 - Python 版本
使用方法: python start.py
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """检查依赖是否安装"""
    required_packages = [
        "fastapi", "uvicorn", "sqlalchemy", "pydantic", "pymysql"
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print("⚠️  以下依赖未安装:")
        for pkg in missing:
            print(f"   - {pkg}")
        print()
        print("请运行以下命令安装依赖:")
        print("  pip install -r requirements.txt")
        print()
        response = input("是否自动安装依赖? (y/n): ")
        if response.lower() == 'y':
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print()
        else:
            print("请先安装依赖后再启动")
            sys.exit(1)

def main():
    # 获取脚本所在目录
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    print("🏥 医院数据管理系统 - 后端启动")
    print("=" * 50)
    
    # 检查依赖
    check_dependencies()

    # 创建必要的目录
    os.makedirs("data", exist_ok=True)
    os.makedirs("chroma_db", exist_ok=True)

    # 构建 uvicorn 命令
    cmd = [
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ]

    print(f"🌟 执行命令: {' '.join(cmd)}")
    print("=" * 50)
    print()
    print("📱 访问地址:")
    print("   - API 文档: http://localhost:8000/docs")
    print("   - 应用首页: http://localhost:3000")
    print()

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 服务已停止")
    except Exception as e:
        print(f"\n❌ 启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
