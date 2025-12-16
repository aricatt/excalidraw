#!/bin/bash

# 部署脚本 - 配合宿主机 Caddy 使用

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 从阿里云镜像仓库部署 Excalidraw Plus (Host Caddy Mode)...${NC}"
echo ""

# 配置 - 使用 VPC 地址（内网）
REGISTRY="crpi-2f6gob7gaag7gqlq-vpc.cn-guangzhou.personal.cr.aliyuncs.com"
NAMESPACE="excalidraw-plus"
VERSION="latest"

# 完整镜像名称
FRONTEND_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-frontend:$VERSION"
BACKEND_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-backend:$VERSION"
VOICE_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-voice:$VERSION"

# 检查 .env 文件
if [ ! -f "./servers/api-service/.env" ]; then
    echo -e "${RED}❌ 错误: 未找到 .env 文件${NC}"
    echo -e "${YELLOW}请先配置: cp servers/api-service/.env.example servers/api-service/.env${NC}"
    exit 1
fi

# 网络名称
NETWORK_NAME="excalidraw-network"

# 1. 登录阿里云镜像仓库
echo -e "${YELLOW}1️⃣  登录阿里云镜像仓库...${NC}"
echo "请输入阿里云镜像仓库密码："
podman login --username=248739402@qq.com $REGISTRY

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 登录失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 登录成功${NC}"
echo ""

# 2. 拉取镜像
echo -e "${YELLOW}2️⃣  拉取镜像...${NC}"
podman pull $FRONTEND_IMAGE
podman pull $BACKEND_IMAGE
podman pull $VOICE_IMAGE
podman pull redis:alpine

echo -e "${GREEN}✅ 所有镜像拉取成功${NC}"
echo ""

# 3. 创建网络
echo -e "${YELLOW}3️⃣  配置网络...${NC}"
if ! podman network exists $NETWORK_NAME 2>/dev/null; then
    podman network create $NETWORK_NAME
    echo -e "${GREEN}✅ 网络创建成功${NC}"
else
    echo -e "${GREEN}✅ 网络已存在${NC}"
fi
echo ""

# 4. 停止旧容器
echo -e "${YELLOW}4️⃣  停止旧容器...${NC}"
podman stop excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis 2>/dev/null || true
podman rm excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis 2>/dev/null || true
echo -e "${GREEN}✅ 旧容器已清理${NC}"
echo ""

# 5. 启动容器
echo -e "${YELLOW}5️⃣  启动服务...${NC}"

# 读取 .env 文件
source ./servers/api-service/.env

# 启动 Redis (仅内部使用)
echo "   启动 Redis..."
podman run -d \
  --name excalidraw-redis \
  --network $NETWORK_NAME \
  --replace \
  --restart always \
  --dns 223.5.5.5 \
  redis:alpine

# 启动后端 (暴露 6601)
echo "   启动后端..."
podman run -d \
  --name excalidraw-backend \
  --network $NETWORK_NAME \
  -p 6601:6601 \
  --replace \
  --restart always \
  --dns 223.5.5.5 \
  --env-file ./servers/api-service/.env \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_URL="redis://excalidraw-redis:6379" \
  -e PORT=6601 \
  -e CORS_ORIGIN="${CORS_ORIGIN:-https://localhost}" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e NODE_ENV="${NODE_ENV:-production}" \
  $BACKEND_IMAGE

# 启动前端 (暴露 8080)
echo "   启动前端..."
podman run -d \
  --name excalidraw-frontend \
  --network $NETWORK_NAME \
  -p 8080:80 \
  --replace \
  --restart always \
  --dns 223.5.5.5 \
  $FRONTEND_IMAGE

# 启动语音服务 (暴露 4408)
echo "   启动语音服务..."
podman run -d \
  --name excalidraw-voice \
  --network $NETWORK_NAME \
  -p 4408:4408 \
  --replace \
  --restart always \
  --dns 223.5.5.5 \
  -e PORT=4408 \
  -e ENABLE_HTTPS=false \
  $VOICE_IMAGE

echo -e "${GREEN}✅ 所有服务已启动${NC}"
echo ""

# 6. 等待服务启动
echo -e "${YELLOW}6️⃣  等待服务启动 (10秒)...${NC}"
sleep 10

# 7. 执行数据库迁移
echo -e "${YELLOW}7️⃣  执行数据库迁移...${NC}"
podman exec excalidraw-backend npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移成功！${NC}"
else
    echo -e "${RED}❌ 数据库迁移失败${NC}"
    echo -e "${YELLOW}请检查 RDS 连接配置${NC}"
fi

echo ""
echo -e "${GREEN}🎉 部署完成！(Host Caddy Mode)${NC}"
echo ""
echo -e "${BLUE}🔧 接下来的步骤 (在服务器上):${NC}"
echo "1. 安装 Caddy: yum install caddy"
echo "2. 配置 /etc/caddy/Caddyfile:"
echo "   :80 {"
echo "     handle_path /api/* { reverse_proxy localhost:6601 }"
echo "     reverse_proxy /socket.io/* localhost:6601"
echo "     reverse_proxy /voice/* localhost:4408"
echo "     reverse_proxy * localhost:8080"
echo "   }"
echo "3. 启动 Caddy: systemctl enable --now caddy"
echo ""
