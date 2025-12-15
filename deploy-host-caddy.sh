#!/bin/bash

# 部署脚本 - 配合宿主机 Caddy 使用

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 部署 Excalidraw Plus (Host Caddy Mode)...${NC}"

# 配置 (请根据实际情况修改)
REGISTRY="crpi-2f6gob7gaag7gqlq-vpc.cn-guangzhou.personal.cr.aliyuncs.com"
NAMESPACE="excalidraw-plus"
VERSION="latest"

# 镜像名称
FRONTEND_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-frontend:$VERSION"
BACKEND_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-backend:$VERSION"
VOICE_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-voice:$VERSION"

# 1. 停止旧容器 (包括之前的 Caddy 容器)
echo -e "${YELLOW}1️⃣  停止旧容器...${NC}"
podman stop excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis 2>/dev/null || true
podman rm excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis 2>/dev/null || true

# 2. 登录阿里云
echo -e "${YELLOW}2️⃣  登录阿里云镜像仓库...${NC}"
# podman login ... (如果已登录可跳过)

# 3. 拉取镜像
echo -e "${YELLOW}3️⃣  拉取最新镜像...${NC}"
podman pull $FRONTEND_IMAGE
podman pull $BACKEND_IMAGE
podman pull $VOICE_IMAGE
podman pull redis:alpine

# 4. 创建网络
podman network exists excalidraw-network || podman network create excalidraw-network

# 5. 启动容器 (注意：暴露端口到宿主机)
echo -e "${YELLOW}4️⃣  启动服务...${NC}"

# Redis (仅内部使用，不用暴露)
echo "   启动 Redis..."
podman run -d --name excalidraw-redis --network excalidraw-network --restart always redis:alpine

# 后端 (暴露 6601)
echo "   启动后端..."
source ./servers/api-service/.env
podman run -d \
  --name excalidraw-backend \
  --network excalidraw-network \
  -p 6601:6601 \
  --restart always \
  --env-file ./servers/api-service/.env \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_URL="redis://excalidraw-redis:6379" \
  -e PORT=6601 \
  -e JWT_SECRET="$JWT_SECRET" \
  -e NODE_ENV="production" \
  $BACKEND_IMAGE

# 前端 (暴露 8080，因为宿主机 80 给 Caddy 了)
echo "   启动前端..."
podman run -d \
  --name excalidraw-frontend \
  --network excalidraw-network \
  -p 8080:80 \
  --restart always \
  $FRONTEND_IMAGE

# 语音 (暴露 4408)
echo "   启动语音服务..."
podman run -d \
  --name excalidraw-voice \
  --network excalidraw-network \
  -p 4408:4408 \
  --restart always \
  $VOICE_IMAGE

echo -e "${GREEN}✅ 所有服务已启动！${NC}"
echo ""
echo "🔧 下一步："
echo "1. 安装 Caddy: yum install caddy"
echo "2. 配置 /etc/caddy/Caddyfile:"
echo "   :80 {"
echo "     reverse_proxy /api/* localhost:6601"
echo "     reverse_proxy /socket.io/* localhost:6601"
echo "     reverse_proxy /voice/* localhost:4408"
echo "     reverse_proxy * localhost:8080"
echo "   }"
echo "3. 启动/重载 Caddy: systemctl enable --now caddy"
