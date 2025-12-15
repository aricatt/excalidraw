#!/bin/bash

# 从阿里云镜像仓库拉取并部署

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 从阿里云镜像仓库部署 Excalidraw Plus...${NC}"
echo ""

# 配置（与 build-and-push.sh 保持一致）
REGISTRY="crpi-2f6gob7gaag7gqlq-vpc.cn-guangzhou.personal.cr.aliyuncs.com"
NAMESPACE="excalidraw-plus"  # 替换为你的命名空间
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

echo "   拉取前端镜像..."
podman pull $FRONTEND_IMAGE

echo "   拉取后端镜像..."
podman pull $BACKEND_IMAGE

echo "   拉取语音服务镜像..."
podman pull $VOICE_IMAGE

echo "   拉取基础镜像..."
podman pull caddy:2-alpine
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

# 启动 Redis
echo "   启动 Redis..."
podman run -d \
  --name excalidraw-redis \
  --network $NETWORK_NAME \
  --restart always \
  redis:alpine

# 启动后端
echo "   启动后端..."
podman run -d \
  --name excalidraw-backend \
  --network $NETWORK_NAME \
  --restart always \
  --env-file ./servers/api-service/.env \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_URL="redis://excalidraw-redis:6379" \
  -e PORT=6601 \
  -e CORS_ORIGIN="${CORS_ORIGIN:-https://localhost}" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e NODE_ENV="${NODE_ENV:-production}" \
  $BACKEND_IMAGE

# 启动前端
echo "   启动前端..."
podman run -d \
  --name excalidraw-frontend \
  --network $NETWORK_NAME \
  --restart always \
  $FRONTEND_IMAGE

# 启动语音服务
echo "   启动语音服务..."
podman run -d \
  --name excalidraw-voice \
  --network $NETWORK_NAME \
  --restart always \
  -e PORT=4408 \
  -e ENABLE_HTTPS=false \
  $VOICE_IMAGE

# 启动 Caddy
echo "   启动 Caddy..."
podman run -d \
  --name excalidraw-caddy \
  --network $NETWORK_NAME \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  -p 443:443/udp \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:2-alpine

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
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${GREEN}📱 访问地址:${NC}"
echo -e "   - 🏠 前端: https://localhost"
echo -e "   - 🔌 API: https://localhost/api"
echo -e "   - 🎤 语音: https://localhost/voice"
echo ""
echo -e "${BLUE}🔧 管理命令:${NC}"
echo -e "   查看容器: ${YELLOW}podman ps${NC}"
echo -e "   查看日志: ${YELLOW}podman logs -f excalidraw-backend${NC}"
echo -e "   重启服务: ${YELLOW}podman restart excalidraw-backend${NC}"
echo ""
