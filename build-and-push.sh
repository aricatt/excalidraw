#!/bin/bash

# 本地构建并推送镜像到阿里云容器镜像服务

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏗️  开始在本地构建镜像...${NC}"
echo ""

# 配置（替换为你的阿里云镜像仓库地址）
REGISTRY="crpi-2f6gob7gaag7gqlq.cn-guangzhou.personal.cr.aliyuncs.com"
NAMESPACE="excalidraw-plus"  # 替换为你的命名空间
VERSION="latest"

# 完整镜像名称
FRONTEND_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-frontend:$VERSION"
BACKEND_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-backend:$VERSION"
VOICE_IMAGE="$REGISTRY/$NAMESPACE/excalidraw-plus-voice:$VERSION"

echo "📋 镜像信息："
echo "   Registry: $REGISTRY"
echo "   Namespace: $NAMESPACE"
echo "   Version: $VERSION"
echo ""

# 1. 构建前端镜像
echo -e "${YELLOW}1️⃣  构建前端镜像...${NC}"
docker build \
  --platform linux/amd64 \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_VOICE_URL=/voice \
  -t $FRONTEND_IMAGE \
  -f excalidraw-plus/Dockerfile \
  .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端镜像构建成功${NC}"
echo ""

# 2. 构建后端镜像
echo -e "${YELLOW}2️⃣  构建后端镜像...${NC}"
docker build \
  --platform linux/amd64 \
  -t $BACKEND_IMAGE \
  -f servers/api-service/Dockerfile \
  .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 后端镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 后端镜像构建成功${NC}"
echo ""

# 3. 构建语音服务镜像
echo -e "${YELLOW}3️⃣  构建语音服务镜像...${NC}"
docker build \
  --platform linux/amd64 \
  -t $VOICE_IMAGE \
  -f servers/aliyunasr/Dockerfile \
  servers/aliyunasr

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 语音服务镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 语音服务镜像构建成功${NC}"
echo ""

# 4. 登录阿里云镜像仓库
echo -e "${YELLOW}4️⃣  登录阿里云镜像仓库...${NC}"
echo "请输入阿里云镜像仓库密码："
docker login --username=248739402@qq.com $REGISTRY

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 登录失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 登录成功${NC}"
echo ""

# 5. 推送镜像
echo -e "${YELLOW}5️⃣  推送镜像到阿里云...${NC}"

echo "   推送前端镜像..."
docker push $FRONTEND_IMAGE

echo "   推送后端镜像..."
docker push $BACKEND_IMAGE

echo "   推送语音服务镜像..."
docker push $VOICE_IMAGE

echo ""
echo -e "${GREEN}🎉 所有镜像已推送成功！${NC}"
echo ""
echo "📋 镜像列表："
echo "   Frontend: $FRONTEND_IMAGE"
echo "   Backend:  $BACKEND_IMAGE"
echo "   Voice:    $VOICE_IMAGE"
echo ""
echo "🚀 下一步："
echo "   1. 在服务器上运行: ./deploy-from-registry.sh"
echo "   2. 或手动拉取: docker pull $FRONTEND_IMAGE"
echo ""
