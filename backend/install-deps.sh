#!/bin/bash

# 依赖安装脚本
echo "🏥 医院数据管理系统 - 依赖安装"
echo "=" * 50

cd "$(dirname "$0")"

# 检查 Python
echo "📋 检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未找到"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"

# 升级 pip
echo ""
echo "📦 升级 pip..."
python3 -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装核心依赖
echo ""
echo "📦 安装核心依赖..."
python3 -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

echo ""
echo "=" * 50
echo "✅ 核心依赖安装完成！"
echo ""
echo "💡 如果需要支持 Oracle/SQL Server 数据库，可安装可选依赖："
echo "   pip install -r requirements-full.txt"
echo ""
echo "🚀 现在可以启动后端了："
echo "   python start.py"
