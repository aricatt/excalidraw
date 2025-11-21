#!/bin/bash

# Excalidraw Plus 启动脚本
# 使用本地 Excalidraw 包

set -e

echo "🚀 启动 Excalidraw Plus..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 excalidraw-plus 目录中运行此脚本"
    exit 1
fi

# 检查本地包是否已构建
if [ ! -d "../packages/excalidraw/dist" ]; then
    echo "📦 本地 Excalidraw 包未构建，正在构建..."
    cd ..
    yarn build:packages
    cd excalidraw-plus
    echo "✅ 包构建完成"
    echo ""
fi

# 启动开发服务器
echo "🌐 启动开发服务器 (http://localhost:4417)..."
npx vite --port 4417
