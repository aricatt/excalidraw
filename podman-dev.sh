#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始 Excalidraw Plus 本地开发环境部署 (Podman)...${NC}"
echo -e "${YELLOW}   使用完整的 Podman 容器（包含 MySQL）${NC}"
echo ""

# 检查 Podman 是否安装
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ 错误: Podman 未安装${NC}"
    echo -e "${YELLOW}请先安装 Podman: https://podman.io/getting-started/installation${NC}"
    exit 1
fi

# 检查 podman-compose 是否安装
if ! command -v podman-compose &> /dev/null; then
    echo -e "${RED}❌ 错误: podman-compose 未安装${NC}"
    echo -e "${YELLOW}安装方法:${NC}"
    echo -e "   pip3 install podman-compose"
    echo -e "   或访问: https://github.com/containers/podman-compose"
    exit 1
fi

# 1. 停止并清理旧容器
echo -e "${YELLOW}🛑 正在停止旧容器...${NC}"
podman-compose -f docker-compose.dev.yml down

# 2. 构建并启动服务
echo -e "${YELLOW}🏗️  正在构建并启动服务 (这可能需要几分钟)...${NC}"
podman-compose -f docker-compose.dev.yml up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Podman 启动失败，请检查错误信息。${NC}"
    exit 1
fi

# 3. 等待 MySQL 启动
echo -e "${YELLOW}⏳ 等待 MySQL 数据库启动 (15秒)...${NC}"
sleep 15

# 4. 检查 MySQL 健康状态
echo -e "${YELLOW}🔍 检查 MySQL 连接状态...${NC}"
for i in {1..10}; do
    if podman-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost -u excalidraw -pexcalidraw_password &> /dev/null; then
        echo -e "${GREEN}✅ MySQL 已就绪！${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ MySQL 启动超时${NC}"
        echo -e "${YELLOW}请检查日志: podman-compose -f docker-compose.dev.yml logs mysql${NC}"
        exit 1
    fi
    echo -e "${YELLOW}   等待 MySQL 启动... ($i/10)${NC}"
    sleep 3
done

# 5. 执行数据库迁移
echo -e "${YELLOW}🔄 正在执行数据库迁移...${NC}"
podman-compose -f docker-compose.dev.yml exec -T backend npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移成功！${NC}"
else
    echo -e "${YELLOW}⚠️  数据库迁移失败，尝试推送 schema...${NC}"
    podman-compose -f docker-compose.dev.yml exec -T backend npx prisma db push --accept-data-loss
fi

echo ""
echo -e "${GREEN}🎉 本地开发环境部署完成！${NC}"
echo ""
echo -e "${GREEN}📱 访问地址 (HTTPS):${NC}"
echo -e "   - 🏠 前端: ${BLUE}https://localhost${NC}"
echo -e "   - 🔌 后端 API: ${BLUE}https://localhost/api${NC}"
echo -e "   - 🎤 语音服务: ${BLUE}https://localhost/voice${NC}"
echo ""
echo -e "${YELLOW}⚠️  首次访问需要信任自签名证书${NC}"
echo -e "   Chrome: 点击 '高级' → '继续访问 localhost (不安全)'"
echo -e "   Firefox: 点击 '高级' → '接受风险并继续'"
echo ""
echo -e "${BLUE}💾 数据库信息:${NC}"
echo -e "   - 使用本地 Podman MySQL 容器"
echo -e "   - 数据库: excalidraw_plus"
echo -e "   - 用户名: excalidraw"
echo -e "   - 密码: excalidraw_password"
echo -e "   - 端口: 3306 (容器内部)"
echo ""
echo -e "${BLUE}🔧 开发工具:${NC}"
echo -e "   - 查看日志: ${YELLOW}podman-compose -f docker-compose.dev.yml logs -f${NC}"
echo -e "   - 查看数据库: ${YELLOW}podman-compose -f docker-compose.dev.yml exec mysql mysql -u excalidraw -p excalidraw_plus${NC}"
echo -e "   - Prisma Studio: ${YELLOW}cd servers/api-service && npx prisma studio${NC}"
echo -e "   - 停止服务: ${YELLOW}podman-compose -f docker-compose.dev.yml down${NC}"
echo -e "   - 查看容器: ${YELLOW}podman ps${NC}"
echo ""
echo -e "${GREEN}📚 查看完整文档: cat HTTPS_DEPLOYMENT.md${NC}"
echo -e "${GREEN}📚 查看 Podman 指南: cat PODMAN_GUIDE.md${NC}"
