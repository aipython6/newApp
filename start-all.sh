#!/bin/bash

# 同时启动前后端
echo "🏥 医院数据管理系统 - 完整启动"
echo "================================="

# 检查是否安装了 tmux 或 screen
if command -v tmux &> /dev/null; then
    echo "✅ 使用 tmux 管理多个终端"
    
    # 创建新的 tmux 会话
    tmux new-session -d -s hospital-system
    
    # 分割窗口
    tmux split-window -v -p 50
    tmux split-window -h -p 50
    
    # 启动后端
    tmux select-pane -t 0
    tmux send-keys "cd backend && ./start.sh" C-m
    
    # 启动前端
    tmux select-pane -t 1
    tmux send-keys "cd frontend && ./start.sh" C-m
    
    # 进入会话
    tmux attach-session -t hospital-system
    
elif command -v screen &> /dev/null; then
    echo "✅ 使用 screen 管理多个终端"
    
    # 分别启动
    echo "请在两个终端中分别运行:"
    echo "  终端1: ./start-backend.sh"
    echo "  终端2: ./start-frontend.sh"
    
else
    echo "⚠️  未检测到 tmux 或 screen"
    echo ""
    echo "请在两个终端中分别运行:"
    echo "  终端1: ./start-backend.sh"
    echo "  终端2: ./start-frontend.sh"
fi
