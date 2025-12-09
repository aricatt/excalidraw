#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始 Excalidraw Plus 生产环境部署 (Podman)...${NC}"
echo -e "${YELLOW}   使用外部阿里云 RDS MySQL 数据库${NC}"
echo -e "${YELLOW}   本地开发请使用: ./podman-dev.sh${NC}"
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

# 检查 .env 文件是否存在
if [ ! -f "./servers/api-service/.env" ]; then
    echo -e "${RED}❌ 错误: 未找到 .env 文件${NC}"
    echo -e "${YELLOW}请先配置数据库连接：${NC}"
    echo -e "   1. 复制示例文件: cp servers/api-service/.env.example servers/api-service/.env"
    echo -e "   2. 编辑 .env 文件，填入阿里云 RDS MySQL 连接信息"
    echo -e "   3. 格式: DATABASE_URL=\"mysql://用户名:密码@RDS地址:3306/数据库名\""
    exit 1
fi

# 1. 停止并清理旧容器
echo -e "${YELLOW}🛑 正在停止旧容器...${NC}"
podman-compose down

# 2. 构建并启动服务
echo -e "${YELLOW}🏗️  正在构建并启动服务 (这可能需要几分钟)...${NC}"
podman-compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Podman 启动失败，请检查错误信息。${NC}"
    exit 1
fi

# 3. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动 (5秒)...${NC}"
sleep 5

# 4. 执行数据库迁移
echo -e "${YELLOW}🔄 正在执行数据库迁移...${NC}"
echo -e "${YELLOW}   连接到阿里云 RDS MySQL...${NC}"

# 尝试执行迁移
podman-compose exec -T backend npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移成功！${NC}"
else
    echo -e "${RED}❌ 数据库迁移失败${NC}"
    echo -e "${YELLOW}可能的原因：${NC}"
    echo -e "   1. RDS MySQL 连接信息不正确"
    echo -e "   2. RDS 白名单未添加服务器 IP"
    echo -e "   3. 数据库不存在或权限不足"
    echo -e ""
    echo -e "${YELLOW}请检查 servers/api-service/.env 中的 DATABASE_URL 配置${NC}"
    echo -e "${YELLOW}如果是首次部署，请先在 RDS 中创建数据库：${NC}"
    echo -e "   CREATE DATABASE excalidraw_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${GREEN}📱 访问地址 (HTTPS):${NC}"
echo -e "   - 🏠 前端: https://localhost"
echo -e "   - 🔌 后端 API: https://localhost/api"
echo -e "   - 🎤 语音服务: https://localhost/voice"
echo ""
echo -e "${YELLOW}⚠️  首次访问需要信任自签名证书${NC}"
echo -e "   Chrome: 点击 '高级' → '继续访问 localhost (不安全)'"
echo -e "   Firefox: 点击 '高级' → '接受风险并继续'"
echo ""
echo -e "${YELLOW}💾 数据库信息:${NC}"
echo -e "   - 使用外部阿里云 RDS MySQL"
echo -e "   - 数据持久化由阿里云 RDS 管理"
echo ""
echo -e "${BLUE}🔧 Podman 管理命令:${NC}"
echo -e "   - 查看日志: ${YELLOW}podman-compose logs -f${NC}"
echo -e "   - 查看容器: ${YELLOW}podman ps${NC}"
echo -e "   - 重启服务: ${YELLOW}podman-compose restart backend${NC}"
echo -e "   - 停止服务: ${YELLOW}podman-compose down${NC}"
echo ""
echo -e "${YELLOW}📚 查看完整部署文档: cat HTTPS_DEPLOYMENT.md${NC}"
echo -e "${YELLOW}📚 查看 Podman 指南: cat PODMAN_GUIDE.md${NC}"
