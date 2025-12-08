# 🚀 快速开始 - 阿里云 RDS MySQL 部署

本指南帮助你在 **5 分钟内** 完成 Excalidraw Plus 的部署配置。

---

## ⚡ 快速步骤

### 1️⃣ 配置数据库连接 (2 分钟)

```bash
# 复制环境变量模板
cp servers/api-service/.env.example servers/api-service/.env

# 编辑配置文件
nano servers/api-service/.env
```

**填入以下内容：**

```bash
# 阿里云 RDS MySQL 连接
# 格式: mysql://用户名:密码@RDS地址:3306/数据库名
DATABASE_URL="mysql://excalidraw:YOUR_PASSWORD@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"

# JWT 密钥（必须修改！）
JWT_SECRET="your-random-secret-key-at-least-32-characters-long"

# CORS 配置
CORS_ORIGIN="https://localhost,https://your-domain.com"

# Redis 配置
REDIS_URL="redis://redis:6379"
```

**获取 RDS 连接信息：**
1. 登录 [阿里云 RDS 控制台](https://rdsnext.console.aliyun.com/)
2. 选择你的 RDS 实例
3. 查看 **基本信息** → **连接信息**
4. 复制内网地址或公网地址

---

### 2️⃣ 初始化数据库 (1 分钟)

```bash
cd servers/api-service

# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate deploy

# 返回项目根目录
cd ../..
```

**如果数据库不存在，先创建：**

```sql
-- 登录 RDS 执行
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

---

### 3️⃣ 部署应用 (2 分钟)

```bash
# Linux/macOS
./docker-plus.sh

# Windows
docker-plus.bat
```

**等待部署完成，看到：**

```
🎉 部署完成！

📱 访问地址 (HTTPS):
   - 🏠 前端: https://localhost
   - 🔌 后端 API: https://localhost/api
   - 🎤 语音服务: https://localhost/voice
```

---

### 4️⃣ 访问应用

1. 打开浏览器访问：`https://localhost`
2. 首次访问会提示证书不安全（正常）
3. 点击 **高级** → **继续访问**
4. 开始使用！

---

## ✅ 检查清单

部署前确认：

- [ ] 阿里云 RDS MySQL 实例已创建
- [ ] 数据库 `excalidraw_plus` 已创建
- [ ] RDS 白名单已添加服务器 IP
- [ ] `.env` 文件已配置
- [ ] `DATABASE_URL` 格式正确
- [ ] Docker 和 docker-compose 已安装

---

## 🔍 验证部署

### 检查服务状态

```bash
# 查看所有容器
docker-compose ps

# 应该看到 5 个服务都在运行：
# ✅ caddy
# ✅ frontend
# ✅ backend
# ✅ voice-service
# ✅ redis
```

### 测试 API

```bash
# 测试健康检查
curl -k https://localhost/api/health

# 应该返回：
# {"status":"ok","database":"connected"}
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看 Caddy 日志
docker-compose logs -f caddy
```

---

## ⚠️ 常见问题

### 问题 1: 连接 RDS 失败

```
Error: Can't reach database server
```

**解决方案：**
1. 检查 RDS 白名单是否包含服务器 IP
2. 测试连接：`telnet rm-xxxxx.mysql.rds.aliyuncs.com 3306`
3. 确认 `DATABASE_URL` 格式正确

### 问题 2: 数据库不存在

```
Error: Unknown database 'excalidraw_plus'
```

**解决方案：**
```sql
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 问题 3: 认证失败

```
Error: Access denied for user 'excalidraw'
```

**解决方案：**
1. 检查用户名和密码
2. 确认用户已授权访问数据库
3. 检查密码中的特殊字符是否需要转义

### 问题 4: 迁移失败

```
Error: P3009: migrate found failed migrations
```

**解决方案：**
```bash
# 重置迁移
cd servers/api-service
npx prisma migrate reset
npx prisma migrate deploy
```

---

## 📚 详细文档

如果需要更多信息，查看：

| 文档 | 说明 |
|------|------|
| [RDS_MYSQL_SETUP.md](./RDS_MYSQL_SETUP.md) | 完整的 RDS 配置指南 |
| [MYSQL_MIGRATION_SUMMARY.md](./MYSQL_MIGRATION_SUMMARY.md) | 迁移总结 |
| [HTTPS_DEPLOYMENT.md](./HTTPS_DEPLOYMENT.md) | HTTPS 部署指南 |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | 部署检查清单 |

---

## 🎯 生产环境部署

### 额外步骤：

1. **修改 Caddyfile**
   ```bash
   # 注释掉本地配置
   # https://localhost { ... }
   
   # 启用生产配置
   your-domain.com { ... }
   ```

2. **更新 .env**
   ```bash
   CORS_ORIGIN="https://your-domain.com"
   NODE_ENV=production
   ```

3. **配置 DNS**
   ```
   A 记录: your-domain.com → YOUR_SERVER_IP
   ```

4. **重新部署**
   ```bash
   ./docker-plus.sh
   ```

---

## 💡 提示

### 安全建议

1. **修改默认密码**
   - 数据库密码
   - JWT_SECRET

2. **配置防火墙**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **定期备份**
   - RDS 自动备份（在控制台配置）
   - 手动备份重要数据

### 性能优化

1. **使用内网地址**
   - 如果应用和 RDS 在同一地域
   - 更快、免费、更安全

2. **配置连接池**
   ```bash
   DATABASE_URL="mysql://...?connection_limit=10&pool_timeout=20"
   ```

3. **启用 Redis 持久化**（可选）
   ```yaml
   # docker-compose.yml
   redis:
     volumes:
       - redis_data:/data
     command: redis-server --appendonly yes
   ```

---

## 🆘 获取帮助

如果遇到问题：

1. 查看日志：`docker-compose logs -f`
2. 检查 RDS 控制台的错误日志
3. 查看详细文档（上面的链接）
4. 检查网络连接和白名单配置

---

## 🎉 完成！

现在你的 Excalidraw Plus 已经成功部署并连接到阿里云 RDS MySQL！

**下一步：**
- 测试所有功能
- 配置域名（生产环境）
- 设置监控和告警
- 定期备份数据

享受你的应用吧！ 🚀
