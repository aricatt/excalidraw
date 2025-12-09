# 🗄️ 阿里云 RDS MySQL 数据库初始化指南

本指南帮助你在已有的阿里云 RDS MySQL 实例上准备 Excalidraw Plus 项目所需的数据库。

---

## 📋 准备工作

### 需要的信息

从阿里云 RDS 控制台获取以下信息：

1. **RDS 连接地址**
   - 内网地址（推荐）：`rm-bp1097neih7sk81c4.mysql.rds.aliyuncs.com`
   - 公网地址（如需要）：``

2. **端口**：通常是 `3306`

3. **主账号信息**（或已创建的账号）
   - 用户名
   - 密码

---

## 🚀 方法一：使用 RDS 控制台（推荐，最简单）

### 步骤 1: 创建数据库

1. 登录 [阿里云 RDS 控制台](https://rdsnext.console.aliyun.com/)
2. 选择你的 RDS 实例
3. 点击左侧菜单 **数据库管理** → **创建数据库**

**填写信息：**
```
数据库名称: excalidraw_plus
字符集: utf8mb4
排序规则: utf8mb4_unicode_ci
备注: Excalidraw Plus 应用数据库
```

4. 点击 **确定**

### 步骤 2: 创建专用账号（推荐）

1. 点击左侧菜单 **账号管理** → **创建账号**

**填写信息：**
```
数据库账号: excalidraw
账号类型: 普通账号
密码: [设置一个强密码，至少 8 位，包含大小写字母和数字]
确认密码: [再次输入密码]
备注: Excalidraw Plus 应用账号
```

2. 点击 **确定**

### 步骤 3: 授权账号访问数据库

1. 在 **账号管理** 页面，找到刚创建的 `excalidraw` 账号
2. 点击 **修改权限**
3. 在 **未授权数据库** 中找到 `excalidraw_plus`
4. 选择 **读写** 权限
5. 点击 **确定**

### 步骤 4: 配置白名单

1. 点击左侧菜单 **数据安全性** → **白名单设置**
2. 点击 **修改** 或 **添加白名单分组**

**添加 IP 地址：**

```
# 如果应用服务器在阿里云 ECS（推荐使用内网）
# 添加 ECS 的内网 IP，例如：
172.16.0.100

# 如果应用服务器在其他地方
# 添加服务器的公网 IP，例如：
123.456.789.0

# 本地开发测试（生产环境请删除）
0.0.0.0/0
```

⚠️ **安全提示**：
- 生产环境不要使用 `0.0.0.0/0`
- 只添加必要的 IP 地址
- 使用内网地址更安全

3. 点击 **确定**

---

## 🔧 方法二：使用 MySQL 客户端（适合熟悉 SQL 的用户）

### 步骤 1: 连接到 RDS

#### 使用 MySQL 命令行

```bash
# 使用主账号连接
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u root \
      -p

# 输入密码后回车
```

#### 使用 MySQL Workbench 或其他 GUI 工具

**连接信息：**
```
主机: rm-xxxxx.mysql.rds.aliyuncs.com
端口: 3306
用户名: root (或你的主账号)
密码: [你的密码]
```

### 步骤 2: 创建数据库

```sql
-- 创建数据库
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 验证创建成功
SHOW DATABASES LIKE 'excalidraw_plus';
```

### 步骤 3: 创建专用用户并授权

```sql
-- 创建用户
CREATE USER 'excalidraw'@'%' IDENTIFIED BY 'your_strong_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON excalidraw_plus.* TO 'excalidraw'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证用户创建成功
SELECT User, Host FROM mysql.user WHERE User = 'excalidraw';
```

### 步骤 4: 测试连接

```bash
# 使用新创建的账号测试连接
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u excalidraw \
      -p excalidraw_plus

# 输入密码后，如果能成功连接，说明配置正确
```

---

## 📝 配置应用连接

### 步骤 1: 创建 .env 文件

```bash
cd /path/to/excalidraw-plus
cp servers/api-service/.env.example servers/api-service/.env
```

### 步骤 2: 编辑 .env 文件

```bash
nano servers/api-service/.env
```

**填入以下内容：**

```bash
# 阿里云 RDS MySQL 连接
# 格式: mysql://用户名:密码@RDS地址:端口/数据库名
DATABASE_URL="mysql://excalidraw:your_password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"

# JWT 密钥（必须修改为随机字符串）
JWT_SECRET="your-random-secret-key-at-least-32-characters-long-change-this"

# 服务器配置
PORT=6601
NODE_ENV=production

# CORS 配置（替换为你的域名）
CORS_ORIGIN="https://your-domain.com"

# Redis 配置（使用 Docker 容器中的 Redis）
REDIS_URL="redis://redis:6379"
```

**重要提示：**
- 将 `your_password` 替换为你设置的密码
- 将 `rm-xxxxx.mysql.rds.aliyuncs.com` 替换为你的 RDS 地址
- 将 `your-domain.com` 替换为你的实际域名
- `JWT_SECRET` 必须是随机字符串，至少 32 位

### 步骤 3: 生成随机 JWT_SECRET

```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 在线生成
# 访问: https://www.random.org/strings/
```

---

## 🔄 初始化数据库表结构

### 方法 1: 使用部署脚本（推荐）

```bash
# 部署脚本会自动执行数据库迁移
./docker-plus.sh
```

脚本会自动：
1. 检查 .env 文件
2. 启动 Docker 容器
3. 连接到 RDS
4. 执行 Prisma 迁移
5. 创建所有必要的表

### 方法 2: 手动执行迁移

```bash
# 进入 api-service 目录
cd servers/api-service

# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate deploy

# 或者直接推送 schema（开发环境）
npx prisma db push

# 返回项目根目录
cd ../..
```

---

## ✅ 验证配置

### 1. 测试数据库连接

```bash
# 方法 1: 使用 MySQL 客户端
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com \
      -u excalidraw \
      -p excalidraw_plus

# 成功连接后，查看数据库
SHOW DATABASES;
USE excalidraw_plus;
SHOW TABLES;
```

### 2. 测试 Prisma 连接

```bash
cd servers/api-service

# 测试连接并查看数据库结构
npx prisma db pull

# 如果成功，说明连接正确
```

### 3. 使用 Prisma Studio 查看数据库

```bash
cd servers/api-service
npx prisma studio
```

浏览器会自动打开 `http://localhost:5555`，你可以看到所有的表和数据。

---

## 📊 数据库表结构

迁移成功后，会创建以下表：

```
excalidraw_plus
├── users                    # 用户表
├── sessions                 # 会话表
├── workspaces              # 工作空间表
├── workspace_members       # 工作空间成员表
├── workspace_invitations   # 工作空间邀请表
├── collections             # 集合表
├── drawings                # 绘图数据表
├── comments                # 评论表
├── collaborations          # 协作表
├── tags                    # 标签表
├── drawing_tags            # 绘图标签关联表
├── drawing_exports         # 绘图导出文件表
├── files                   # 通用文件存储表
├── ai_preferences          # AI 偏好设置表
├── ai_usage_logs           # AI 使用日志表
└── _prisma_migrations      # Prisma 迁移记录表
```

---

## 🔍 常见问题排查

### 问题 1: 连接超时

```
Error: Can't reach database server at `rm-xxxxx.mysql.rds.aliyuncs.com:3306`
```

**解决方案：**
1. 检查白名单是否包含你的服务器 IP
2. 测试网络连接：
   ```bash
   telnet rm-xxxxx.mysql.rds.aliyuncs.com 3306
   # 或
   nc -zv rm-xxxxx.mysql.rds.aliyuncs.com 3306
   ```
3. 确认使用正确的地址（内网 vs 公网）

### 问题 2: 认证失败

```
Error: Access denied for user 'excalidraw'@'xxx.xxx.xxx.xxx'
```

**解决方案：**
1. 检查用户名和密码是否正确
2. 确认用户已授权访问数据库：
   ```sql
   SHOW GRANTS FOR 'excalidraw'@'%';
   ```
3. 检查密码中是否有特殊字符需要转义

### 问题 3: 数据库不存在

```
Error: Unknown database 'excalidraw_plus'
```

**解决方案：**
```sql
-- 创建数据库
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 问题 4: 字符集问题

```
Error: Incorrect string value
```

**解决方案：**
```sql
-- 检查数据库字符集
SELECT 
  SCHEMA_NAME,
  DEFAULT_CHARACTER_SET_NAME,
  DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'excalidraw_plus';

-- 如果不是 utf8mb4，修改字符集
ALTER DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 问题 5: 迁移失败

```
Error: P3009: migrate found failed migrations
```

**解决方案：**
```bash
# 方法 1: 重置迁移（会删除数据）
cd servers/api-service
npx prisma migrate reset

# 方法 2: 直接推送 schema
npx prisma db push --accept-data-loss

# 方法 3: 手动修复迁移记录
# 登录数据库，检查 _prisma_migrations 表
```

---

## 🔐 安全建议

### 1. 使用强密码

```bash
# 密码要求：
# - 至少 8 位
# - 包含大写字母
# - 包含小写字母
# - 包含数字
# - 包含特殊字符（推荐）

# 示例强密码：
Excalidraw@2024!Secure
```

### 2. 限制白名单

```
# 只添加必要的 IP
# ✅ 好的做法
123.456.789.0

# ❌ 不好的做法（生产环境）
0.0.0.0/0
```

### 3. 使用内网地址

如果应用服务器和 RDS 在同一地域：
```bash
# 使用内网地址（更快、更安全、免费流量）
DATABASE_URL="mysql://excalidraw:password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"
```

### 4. 定期更换密码

```sql
-- 每 90 天更换一次密码
ALTER USER 'excalidraw'@'%' IDENTIFIED BY 'new_strong_password';
```

### 5. 启用 SSL 连接（可选）

```bash
# 下载 RDS SSL 证书
wget https://rds-ca-2019.oss-cn-hangzhou.aliyuncs.com/ApsaraDB-CA-Chain.zip

# 配置 DATABASE_URL
DATABASE_URL="mysql://excalidraw:password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus?ssl-mode=REQUIRED"
```

---

## 📋 完整配置检查清单

部署前确认：

- [ ] RDS 实例已创建并运行
- [ ] 数据库 `excalidraw_plus` 已创建
- [ ] 字符集设置为 `utf8mb4`
- [ ] 排序规则设置为 `utf8mb4_unicode_ci`
- [ ] 用户 `excalidraw` 已创建
- [ ] 用户已授权访问 `excalidraw_plus` 数据库
- [ ] 白名单已添加服务器 IP
- [ ] `.env` 文件已创建
- [ ] `DATABASE_URL` 配置正确
- [ ] `JWT_SECRET` 已设置为随机值
- [ ] 测试连接成功
- [ ] Prisma 迁移已执行
- [ ] 数据库表已创建

---

## 🎉 完成！

现在你的阿里云 RDS MySQL 数据库已经准备好了！

### 下一步：

```bash
# 部署应用
./docker-plus.sh

# 访问应用
https://your-domain.com
```

### 查看数据：

```bash
# 使用 Prisma Studio
cd servers/api-service
npx prisma studio

# 或使用 MySQL 客户端
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com \
      -u excalidraw \
      -p excalidraw_plus
```

---

## 📚 相关文档

- [RDS_MYSQL_SETUP.md](./RDS_MYSQL_SETUP.md) - RDS 完整配置指南
- [DUAL_ENVIRONMENT_GUIDE.md](./DUAL_ENVIRONMENT_GUIDE.md) - 双环境部署指南
- [QUICK_START.md](./QUICK_START.md) - 快速开始

---

**数据库准备完成，开始部署你的应用吧！** 🚀
