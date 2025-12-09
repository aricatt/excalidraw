#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始 Excalidraw Plus 生产环境部署 (纯 Podman)...${NC}"
echo -e "${YELLOW}   使用外部阿里云 RDS MySQL 数据库${NC}"
echo -e "${YELLOW}   不依赖 podman-compose${NC}"
echo ""

# 检查 Podman 是否安装
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ 错误: Podman 未安装${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f "./servers/api-service/.env" ]; then
    echo -e "${RED}❌ 错误: 未找到 .env 文件${NC}"
    echo -e "${YELLOW}请先配置: cp servers/api-service/.env.example servers/api-service/.env${NC}"
    exit 1
fi

# 读取 .env 文件
source ./servers/api-service/.env

# 网络名称
NETWORK_NAME="excalidraw-network"

# 1. 创建网络（如果不存在）
echo -e "${YELLOW}🔧 配置网络...${NC}"
if ! podman network exists $NETWORK_NAME 2>/dev/null; then
    podman network create $NETWORK_NAME
    echo -e "${GREEN}✅ 网络创建成功${NC}"
else
    echo -e "${GREEN}✅ 网络已存在${NC}"
fi

# 2. 停止并删除旧容器
echo -e "${YELLOW}🛑 清理旧容器...${NC}"
podman stop excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis 2>/dev/null || true
podman rm excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis 2>/dev/null || true

# 3. 启动 Redis
echo -e "${YELLOW}🚀 启动 Redis...${NC}"
podman run -d \
  --name excalidraw-redis \
  --network $NETWORK_NAME \
  --restart always \
  redis:alpine

# 4. 构建并启动后端
echo -e "${YELLOW}🏗️  构建后端服务...${NC}"
podman build -t excalidraw-backend:latest -f servers/api-service/Dockerfile .

echo -e "${YELLOW}🚀 启动后端服务...${NC}"
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
  excalidraw-backend:latest

# 5. 构建并启动前端
echo -e "${YELLOW}🏗️  构建前端服务...${NC}"
podman build -t excalidraw-frontend:latest \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_VOICE_URL=/voice \
  -f excalidraw-plus/Dockerfile .

echo -e "${YELLOW}🚀 启动前端服务...${NC}"
podman run -d \
  --name excalidraw-frontend \
  --network $NETWORK_NAME \
  --restart always \
  excalidraw-frontend:latest

# 6. 构建并启动语音服务
echo -e "${YELLOW}🏗️  构建语音服务...${NC}"
podman build -t excalidraw-voice:latest -f servers/aliyunasr/Dockerfile servers/aliyunasr

echo -e "${YELLOW}🚀 启动语音服务...${NC}"
podman run -d \
  --name excalidraw-voice \
  --network $NETWORK_NAME \
  --restart always \
  -e PORT=4408 \
  -e ENABLE_HTTPS=false \
  excalidraw-voice:latest

# 7. 启动 Caddy
echo -e "${YELLOW}🚀 启动 Caddy 网关...${NC}"
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

# 8. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动 (10秒)...${NC}"
sleep 10

# 9. 执行数据库迁移
echo -e "${YELLOW}🔄 执行数据库迁移...${NC}"
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
echo -e "   停止所有: ${YELLOW}podman stop excalidraw-caddy excalidraw-frontend excalidraw-backend excalidraw-voice excalidraw-redis${NC}"
echo ""
