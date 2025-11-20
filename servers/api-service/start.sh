#!/bin/bash

# Excalidraw Plus API Service 启动脚本

set -e

echo "🚀 启动 Excalidraw Plus API Service..."

# 检查 Docker 是否运行
echo "📦 检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行,正在启动 Docker Desktop..."
    open -a Docker
    echo "⏳ 等待 Docker 启动 (大约需要 30 秒)..."
    
    # 等待 Docker 就绪
    for i in {1..30}; do
        if docker info > /dev/null 2>&1; then
            echo "✅ Docker 已就绪!"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker 启动超时,请手动启动 Docker Desktop 后重试"
        exit 1
    fi
fi

echo "✅ Docker 运行正常"

# 启动 PostgreSQL 和 Redis
echo "🗄️  启动数据库服务..."
docker-compose -f docker-compose.dev.yml up -d

# 等待数据库就绪
echo "⏳ 等待 PostgreSQL 就绪..."
sleep 5

# 检查数据库连接
echo "🔌 检查数据库连接..."
if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL 连接成功!"
else
    echo "⚠️  PostgreSQL 可能还在初始化,继续执行..."
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 运行数据库迁移
echo "🗃️  运行数据库迁移..."
npx prisma migrate dev --name init || npx prisma db push

echo ""
echo "✅ 所有服务已启动!"
echo ""
echo "📊 服务状态:"
docker-compose -f docker-compose.dev.yml ps
echo ""
echo "🌐 API 服务地址: http://localhost:6602"
echo "🗄️  PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "💡 启动开发服务器:"
echo "   npm run dev"
echo ""
echo "🛑 停止所有服务:"
echo "   docker-compose -f docker-compose.dev.yml down"
