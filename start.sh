#!/bin/bash

# Smart Dog Scratch编程平台启动脚本

echo "启动 Smart Dog Scratch编程平台..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "警告: Node.js版本过低 (需要v14+)"
    echo "当前版本: $(node -v)"
    read -p "是否继续? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "错误: npm未安装"
    exit 1
fi

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "端口 $port 已被占用"
        return 1
    fi
    return 0
}

# 检查前端端口
if ! check_port 3000; then
    echo "请关闭占用3000端口的程序，或修改前端端口"
    exit 1
fi

# 检查后端端口
if ! check_port 8080; then
    echo "请关闭占用8080端口的程序，或修改后端端口"
    exit 1
fi

# 检查WebSocket端口
if ! check_port 8081; then
    echo "请关闭占用8081端口的程序，或修改WebSocket端口"
    exit 1
fi

# 安装前端依赖
echo "安装前端依赖..."
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "前端依赖安装失败"
        exit 1
    fi
fi

# 安装后端依赖
echo "安装后端依赖..."
if [ ! -d "backend/node_modules" ]; then
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "后端依赖安装失败"
        exit 1
    fi
    cd ..
fi

# 启动后端服务
echo "启动后端API服务 (端口: 8080, WebSocket: 8081)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if ! curl -s http://localhost:8080/api/status > /dev/null; then
    echo "后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务
echo "启动前端开发服务器 (端口: 3000)..."
npm start &
FRONTEND_PID=$!

# 等待前端启动
echo "等待前端服务启动..."
sleep 5

# 显示启动信息
echo ""
echo "========================================"
echo "Smart Dog Scratch编程平台启动成功！"
echo "========================================"
echo ""
echo "访问地址: http://localhost:3000"
echo "API地址: http://localhost:8080"
echo "WebSocket: ws://localhost:8081"
echo ""
echo "服务列表:"
echo "  - 前端: localhost:3000 (PID: $FRONTEND_PID)"
echo "  - 后端: localhost:8080 (PID: $BACKEND_PID)"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "========================================"

# 捕获Ctrl+C信号
trap 'kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; echo "服务已停止"; exit' INT

# 保持脚本运行
wait