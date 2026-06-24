#!/bin/bash

# 后端启动脚本
# 使用方法: ./start.sh 或 bash start.sh

echo "🚀 启动医院数据管理系统后端..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查是否在虚拟环境中
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "⚠️  未检测到虚拟环境"
    echo "尝试激活 conda 环境 (meta)..."
    if command -v conda &> /dev/null; then
        source $(conda info --base)/etc/profile.d/conda.sh
        conda activate meta
        echo "✅ Conda 环境 'meta' 已激活"
    else
        echo "⚠️  Conda 不可用，请手动激活您的虚拟环境"
    fi
fi

# 检查虚拟环境中的 Python
echo "🐍 Python 版本: $(python --version)"

# 创建数据目录
mkdir -p data chroma_db

# 启动 FastAPI 应用
echo "🌟 启动 FastAPI 服务..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
