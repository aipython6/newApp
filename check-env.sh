#!/bin/bash

# 环境检查脚本
echo "🏥 医院数据管理系统 - 环境检查"
echo "================================="
echo ""

# 检查 Python
echo "📋 检查 Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ $PYTHON_VERSION"
else
    echo "❌ Python3 未找到"
fi

# 检查 conda 和 meta 环境
echo ""
echo "📋 检查 Conda..."
if command -v conda &> /dev/null; then
    CONDA_VERSION=$(conda --version)
    echo "✅ $CONDA_VERSION"
    
    if conda env list | grep -q "meta"; then
        echo "✅ 找到 'meta' 环境"
    else
        echo "⚠️  未找到 'meta' 环境"
    fi
else
    echo "❌ Conda 未找到"
fi

# 检查 Node.js
echo ""
echo "📋 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION"
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo "✅ npm $NPM_VERSION"
    fi
else
    echo "❌ Node.js 未找到"
fi

# 检查项目文件
echo ""
echo "📋 检查项目文件..."
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1"
    fi
}

check_file "$PROJECT_DIR/backend/main.py"
check_file "$PROJECT_DIR/backend/requirements.txt"
check_file "$PROJECT_DIR/backend/start.py"
check_file "$PROJECT_DIR/frontend/package.json"
check_file "$PROJECT_DIR/frontend/src/main.tsx"

echo ""
echo "================================="
echo "✅ 环境检查完成"
echo ""
echo "🚀 下一步："
echo "1. 激活 conda 环境: conda activate meta"
echo "2. 安装依赖（首次）"
echo "   - 后端: cd backend && pip install -r requirements.txt"
echo "   - 前端: cd frontend && npm install"
echo "3. 启动服务:"
echo "   - 后端: ./start-backend.sh"
echo "   - 前端: ./start-frontend.sh"
