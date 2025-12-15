# 🚀 生产环境配置指南

## ✅ 必须配置的项目

### 1. DATABASE_URL ⭐⭐⭐⭐⭐ (必需)

**作用：** 连接阿里云 RDS MySQL 数据库

**格式：**
```bash
DATABASE_URL="mysql://用户名:密码@RDS地址:端口/数据库名"
```

**示例：**
```bash
# 你的配置（根据你的 RDS 信息填写）
DATABASE_URL="mysql://excalidraw:your_password@rm-bp1097neih7sk81c4.mysql.rds.aliyuncs.com:3306/excalidraw_plus"
```

**如何获取：**
1. 登录阿里云 RDS 控制台
2. 查看 **基本信息** → **连接信息**
3. 复制内网地址（推荐）或公网地址

**⚠️ 注意：**
- 必须使用你在 RDS 中创建的数据库名
- 密码中如果有特殊字符，需要 URL 编码
- 推荐使用内网地址（更快、更安全）

---

### 2. JWT_SECRET ⭐⭐⭐⭐⭐ (必需)

**作用：** 用于加密用户登录令牌（Token）

**要求：**
- 至少 32 个字符
- 随机生成
- 绝对不能泄露

**生成方法：**

```bash
# 方法 1: 使用 openssl（推荐）
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 在线生成
# 访问: https://www.random.org/strings/
```

**示例：**
```bash
JWT_SECRET="Kx9mP2vL8nQ4wR7tY1uI5oP3aS6dF0gH9jK2lZ4xC8vB7nM1qW5eR3tY6uI9oP0a"
```

**⚠️ 警告：**
- ❌ 不要使用默认值
- ❌ 不要使用简单密码
- ❌ 不要提交到 Git
- ✅ 每个环境使用不同的密钥

---

### 3. CORS_ORIGIN ⭐⭐⭐⭐⭐ (必需)

**作用：** 控制哪些域名可以访问你的 API

**格式：**
```bash
CORS_ORIGIN="https://your-domain.com"
```

**示例：**
```bash
# 单个域名
CORS_ORIGIN="https://draw.example.com"

# 多个域名（用逗号分隔）
CORS_ORIGIN="https://draw.example.com,https://draw.example.cn"
```

**⚠️ 注意：**
- 必须使用 `https://`（不是 `http://`）
- 必须是你的实际域名
- 不要在生产环境使用 `*`

---

### 4. NODE_ENV ⭐⭐⭐⭐ (强烈推荐)

**作用：** 告诉应用当前运行环境

**配置：**
```bash
NODE_ENV=production
```

**影响：**
- 启用生产优化
- 禁用调试信息
- 提高性能

---

## 🔧 可选但推荐配置的项目

### 5. REDIS_URL ⭐⭐⭐ (推荐)

**作用：** 缓存和会话管理

**当前配置：**
```bash
# 使用 Docker 容器中的 Redis
REDIS_URL="redis://redis:6379"
```

**如果使用阿里云 Redis：**
```bash
REDIS_URL="redis://:your_password@r-xxxxx.redis.rds.aliyuncs.com:6379"
```

**是否必需：** 
- ✅ 推荐配置（提高性能）
- ⚠️ 不配置也能运行，但性能较差

---

### 6. MAX_FILE_SIZE ⭐⭐ (可选)

**作用：** 限制上传文件大小

**默认值：**
```bash
MAX_FILE_SIZE=10485760  # 10MB
```

**调整建议：**
```bash
# 小型应用
MAX_FILE_SIZE=5242880   # 5MB

# 中型应用
MAX_FILE_SIZE=10485760  # 10MB

# 大型应用
MAX_FILE_SIZE=52428800  # 50MB
```

---

### 7. UPLOAD_DIR ⭐⭐ (可选)

**作用：** 文件上传目录

**默认值：**
```bash
UPLOAD_DIR="./uploads"
```

**建议：**
- 保持默认值即可
- 或使用绝对路径：`/var/app/uploads`

---

### 8. Email 配置 ⭐ (可选)

**作用：** 发送邮件（用户验证、通知等）

**配置：**
```bash
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="noreply@example.com"
SMTP_PASS="your_email_password"
```

**是否必需：**
- ❌ 不是必需的
- ✅ 如果需要邮件功能才配置

---

## 📋 生产环境完整配置模板

```bash
# ============================================
# 生产环境配置
# ============================================

# ========== 必需配置 ==========

# 1. 数据库连接（阿里云 RDS MySQL）
DATABASE_URL="mysql://excalidraw:YOUR_PASSWORD@rm-bp1097neih7sk81c4.mysql.rds.aliyuncs.com:3306/excalidraw_plus"

# 2. JWT 密钥（必须随机生成）
JWT_SECRET="YOUR_RANDOM_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG"

# 3. CORS 配置（你的域名）
CORS_ORIGIN="https://your-domain.com"

# 4. 运行环境
NODE_ENV=production

# ========== 推荐配置 ==========

# 5. Redis 缓存（使用 Docker 容器）
REDIS_URL="redis://redis:6379"

# 6. 服务器端口（默认）
PORT=6601

# 7. 文件上传限制
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# ========== 可选配置 ==========

# 8. 邮件服务（如果需要）
# SMTP_HOST=""
# SMTP_PORT=587
# SMTP_USER=""
# SMTP_PASS=""
```

---

## 🎯 配置步骤

### 1. 复制示例文件

```bash
cp servers/api-service/.env.example servers/api-service/.env
```

### 2. 编辑配置文件

```bash
nano servers/api-service/.env
```

### 3. 填写必需配置

**最少需要修改这 3 项：**

```bash
# 1. 数据库连接（替换为你的 RDS 信息）
DATABASE_URL="mysql://excalidraw:YOUR_PASSWORD@rm-bp1097neih7sk81c4.mysql.rds.aliyuncs.com:3306/excalidraw_plus"

# 2. JWT 密钥（生成随机值）
JWT_SECRET="$(openssl rand -base64 32)"

# 3. CORS 域名（替换为你的域名）
CORS_ORIGIN="https://your-domain.com"
```

### 4. 保存并退出

```bash
# Ctrl+O 保存
# Ctrl+X 退出
```

---

## ✅ 配置检查清单

部署前确认：

- [ ] `DATABASE_URL` 已填写正确的 RDS 连接信息
- [ ] `JWT_SECRET` 已生成随机密钥（至少 32 字符）
- [ ] `CORS_ORIGIN` 已设置为你的域名
- [ ] `NODE_ENV` 设置为 `production`
- [ ] `.env` 文件存在于 `servers/api-service/` 目录
- [ ] `.env` 文件没有提交到 Git（已在 .gitignore 中）

---

## 🔍 验证配置

### 1. 检查文件是否存在

```bash
ls -la servers/api-service/.env
```

### 2. 查看配置内容（隐藏敏感信息）

```bash
cat servers/api-service/.env | grep -v "PASSWORD\|SECRET"
```

### 3. 测试数据库连接

```bash
# 进入 api-service 目录
cd servers/api-service

# 测试连接
npx prisma db pull
```

---

## 🚨 安全提示

### ✅ 必须做的

1. **不要提交 .env 到 Git**
   ```bash
   # 确认 .gitignore 包含
   echo "servers/api-service/.env" >> .gitignore
   ```

2. **使用强密码**
   - 数据库密码：至少 12 位，包含大小写字母、数字、特殊字符
   - JWT_SECRET：至少 32 位随机字符

3. **定期更换密钥**
   - 每 90 天更换一次 JWT_SECRET
   - 每 90 天更换一次数据库密码

### ❌ 不要做的

1. ❌ 不要使用默认值
2. ❌ 不要使用简单密码（如 `123456`）
3. ❌ 不要在代码中硬编码密钥
4. ❌ 不要在公开场合分享配置

---

## 💡 快速配置命令

```bash
# 1. 复制配置文件
cp servers/api-service/.env.example servers/api-service/.env

# 2. 生成 JWT_SECRET
echo "JWT_SECRET=\"$(openssl rand -base64 32)\"" >> servers/api-service/.env.tmp

# 3. 编辑配置
nano servers/api-service/.env

# 填入：
# - DATABASE_URL（你的 RDS 连接）
# - CORS_ORIGIN（你的域名）
# - 复制上面生成的 JWT_SECRET
```

---

## 🎉 配置完成后

运行部署脚本：

```bash
./podman-plus.sh
```

---

## 📚 相关文档

- [RDS_DATABASE_INIT.md](./RDS_DATABASE_INIT.md) - RDS 数据库初始化
- [RDS_QUICK_SETUP.md](./RDS_QUICK_SETUP.md) - RDS 快速配置
- [DUAL_ENVIRONMENT_GUIDE.md](./DUAL_ENVIRONMENT_GUIDE.md) - 双环境部署

---

**记住：DATABASE_URL、JWT_SECRET、CORS_ORIGIN 这三个是必须配置的！** 🔑
