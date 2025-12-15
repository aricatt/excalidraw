#!/bin/bash

# 创建生产环境部署包

echo "📦 创建生产环境部署包..."

# 创建临时目录
DEPLOY_DIR="excalidraw-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/servers/api-service

# 复制必要文件
echo "复制文件..."
cp deploy-from-registry.sh $DEPLOY_DIR/
cp Caddyfile $DEPLOY_DIR/
cp servers/api-service/.env.example $DEPLOY_DIR/servers/api-service/

# 创建 README
cat > $DEPLOY_DIR/README.md <<'EOF'
# Excalidraw Plus 生产环境部署

## 快速部署

1. 配置环境变量
   ```bash
   cp servers/api-service/.env.example servers/api-service/.env
   nano servers/api-service/.env
   ```

2. 运行部署脚本
   ```bash
   chmod +x deploy-from-registry.sh
   ./deploy-from-registry.sh
   ```

## 必需配置

在 `servers/api-service/.env` 中配置：

- DATABASE_URL - RDS MySQL 连接
- JWT_SECRET - JWT 密钥
- CORS_ORIGIN - 你的域名

## 访问地址

- 前端: https://your-domain.com
- API: https://your-domain.com/api
- 语音: https://your-domain.com/voice
EOF

# 打包
echo "打包..."
tar -czf excalidraw-deploy.tar.gz $DEPLOY_DIR

# 清理
rm -rf $DEPLOY_DIR

echo "✅ 部署包创建完成: excalidraw-deploy.tar.gz"
echo ""
echo "上传到服务器："
echo "  scp excalidraw-deploy.tar.gz root@your-server:/opt/"
echo ""
echo "在服务器上解压并部署："
echo "  tar -xzf excalidraw-deploy.tar.gz"
echo "  cd excalidraw-deploy"
echo "  nano servers/api-service/.env"
echo "  ./deploy-from-registry.sh"
