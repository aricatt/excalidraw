#!/bin/bash

# 一键启动开发环境 (包括 API 服务器)

set -e

echo "🚀 启动完整开发环境..."

# 运行 start.sh 准备环境
./start.sh

# 启动 API 服务器
echo ""
echo "🌐 启动 API 服务器..."
echo "📝 提示: 按 Ctrl+C 停止服务器"
echo ""

npm run dev
