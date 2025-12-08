#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 开始 Excalidraw Plus Docker 部署流程...${NC}"

# 1. 停止并清理旧容器
echo -e "${YELLOW}🛑 正在停止旧容器...${NC}"
docker-compose down

# 2. 构建并启动服务
echo -e "${YELLOW}🏗️  正在构建并启动服务 (这可能需要几分钟)...${NC}"
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo "❌ Docker 启动失败，请检查错误信息。"
    exit 1
fi

# 3. 等待数据库启动
echo -e "${YELLOW}⏳ 等待数据库服务就绪 (10秒)...${NC}"
sleep 10

# 4. 执行数据库迁移
echo -e "${YELLOW}🔄 正在执行数据库迁移/初始化...${NC}"
docker-compose exec backend npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移成功！${NC}"
else
    echo "❌ 数据库迁移失败，请检查后端日志。"
    # 不退出，因为服务可能已经启动，只是迁移失败
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
echo -e "${YELLOW}📚 查看完整部署文档: cat HTTPS_DEPLOYMENT.md${NC}"
echo -e "${YELLOW}🔍 查看日志命令: docker-compose logs -f${NC}"

