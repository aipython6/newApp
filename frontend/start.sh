#!/bin/bash

# 前端启动脚本
# 使用方法: ./start.sh 或 bash start.sh

echo "🚀 启动医院数据管理系统前端..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install --registry=https://registry.npmmirror.com
fi

# 启动开发服务器
echo "🌟 启动 Vite 开发服务器..."
npm run dev
