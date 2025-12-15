#!/bin/bash

# 生产环境配置检查脚本

echo "🔍 检查生产环境配置..."
echo ""

ENV_FILE="./servers/api-service/.env"
ERRORS=0
WARNINGS=0

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 错误: .env 文件不存在${NC}"
    echo ""
    echo "请先创建配置文件："
    echo "  cp servers/api-service/.env.example servers/api-service/.env"
    echo "  nano servers/api-service/.env"
    exit 1
fi

echo -e "${GREEN}✅ .env 文件存在${NC}"
echo ""

# 加载环境变量
source "$ENV_FILE" 2>/dev/null

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "必需配置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查 DATABASE_URL
echo -n "1. DATABASE_URL: "
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ 未配置${NC}"
    ((ERRORS++))
elif [[ "$DATABASE_URL" == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  使用 localhost（应该使用 RDS 地址）${NC}"
    ((WARNINGS++))
elif [[ "$DATABASE_URL" == *"username:password"* ]]; then
    echo -e "${RED}❌ 使用默认值（请填写实际 RDS 信息）${NC}"
    ((ERRORS++))
elif [[ "$DATABASE_URL" == mysql://* ]]; then
    echo -e "${GREEN}✅ 已配置${NC}"
    # 隐藏密码显示
    DB_SAFE=$(echo "$DATABASE_URL" | sed 's/:.*@/:***@/')
    echo "   $DB_SAFE"
else
    echo -e "${RED}❌ 格式错误${NC}"
    ((ERRORS++))
fi
echo ""

# 2. 检查 JWT_SECRET
echo -n "2. JWT_SECRET: "
if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ 未配置${NC}"
    ((ERRORS++))
elif [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  太短（建议至少 32 字符）${NC}"
    echo "   当前长度: ${#JWT_SECRET} 字符"
    ((WARNINGS++))
elif [[ "$JWT_SECRET" == *"change-this"* ]] || [[ "$JWT_SECRET" == *"your-super-secret"* ]]; then
    echo -e "${RED}❌ 使用默认值（请生成随机密钥）${NC}"
    echo "   生成命令: openssl rand -base64 32"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ 已配置（${#JWT_SECRET} 字符）${NC}"
fi
echo ""

# 3. 检查 CORS_ORIGIN
echo -n "3. CORS_ORIGIN: "
if [ -z "$CORS_ORIGIN" ]; then
    echo -e "${RED}❌ 未配置${NC}"
    ((ERRORS++))
elif [[ "$CORS_ORIGIN" == *"your-domain.com"* ]]; then
    echo -e "${RED}❌ 使用默认值（请填写实际域名）${NC}"
    ((ERRORS++))
elif [[ "$CORS_ORIGIN" == "https://"* ]]; then
    echo -e "${GREEN}✅ 已配置${NC}"
    echo "   $CORS_ORIGIN"
else
    echo -e "${YELLOW}⚠️  应该使用 https://（当前: $CORS_ORIGIN）${NC}"
    ((WARNINGS++))
fi
echo ""

# 4. 检查 NODE_ENV
echo -n "4. NODE_ENV: "
if [ -z "$NODE_ENV" ]; then
    echo -e "${YELLOW}⚠️  未配置（建议设置为 production）${NC}"
    ((WARNINGS++))
elif [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}✅ production${NC}"
else
    echo -e "${YELLOW}⚠️  $NODE_ENV（建议设置为 production）${NC}"
    ((WARNINGS++))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "可选配置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 5. 检查 REDIS_URL
echo -n "5. REDIS_URL: "
if [ -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}⚠️  未配置（建议配置以提高性能）${NC}"
else
    echo -e "${GREEN}✅ 已配置${NC}"
fi
echo ""

# 6. 检查 PORT
echo -n "6. PORT: "
if [ -z "$PORT" ]; then
    echo -e "${YELLOW}⚠️  未配置（将使用默认值）${NC}"
else
    echo -e "${GREEN}✅ $PORT${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 配置完美！可以开始部署了！${NC}"
    echo ""
    echo "运行部署命令："
    echo "  ./podman-plus.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  有 $WARNINGS 个警告，但可以部署${NC}"
    echo ""
    echo "建议修复警告后再部署，或者直接运行："
    echo "  ./podman-plus.sh"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERRORS 个错误，$WARNINGS 个警告${NC}"
    echo ""
    echo "请修复错误后再部署："
    echo "  nano servers/api-service/.env"
    echo ""
    echo "修复后重新检查："
    echo "  ./check-config.sh"
    exit 1
fi
