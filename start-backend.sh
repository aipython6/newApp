#!/bin/bash

# 项目根目录后端启动脚本
echo "🏥 医院数据管理系统 - 后端启动"
echo "================================="

cd backend

# 检查虚拟环境
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "检测到 conda 环境..."
    if command -v conda &> /dev/null; then
        source $(conda info --base)/etc/profile.d/conda.sh
        conda activate meta
        echo "✅ 已激活 conda 环境: meta"
    fi
fi

# 启动后端
./start.sh
