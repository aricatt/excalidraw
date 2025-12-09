# ⚡ RDS 数据库快速配置清单

已有阿里云 RDS MySQL？按照这个清单快速配置！

---

## 🎯 5 分钟快速配置

### ✅ 步骤 1: 创建数据库（1 分钟）

**在 RDS 控制台：**
1. 进入你的 RDS 实例
2. 点击 **数据库管理** → **创建数据库**
3. 填写：
   ```
   数据库名称: excalidraw_plus
   字符集: utf8mb4
   排序规则: utf8mb4_unicode_ci
   ```
4. 点击 **确定**

**或使用 SQL：**
```sql
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

---

### ✅ 步骤 2: 创建用户（1 分钟）

**在 RDS 控制台：**
1. 点击 **账号管理** → **创建账号**
2. 填写：
   ```
   数据库账号: excalidraw
   密码: [设置强密码]
   ```
3. 点击 **确定**
4. 点击 **修改权限**，授予 `excalidraw_plus` 数据库的 **读写** 权限

**或使用 SQL：**
```sql
CREATE USER 'excalidraw'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON excalidraw_plus.* TO 'excalidraw'@'%';
FLUSH PRIVILEGES;
```

---

### ✅ 步骤 3: 配置白名单（1 分钟）

**在 RDS 控制台：**
1. 点击 **数据安全性** → **白名单设置**
2. 添加你的服务器 IP

```
# 生产服务器 IP
123.456.789.0

# 或本地测试（仅开发环境）
0.0.0.0/0
```

---

### ✅ 步骤 4: 配置应用（1 分钟）

```bash
# 1. 复制配置文件
cp servers/api-service/.env.example servers/api-service/.env

# 2. 编辑配置
nano servers/api-service/.env
```

**填入：**
```bash
DATABASE_URL="mysql://excalidraw:your_password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"
JWT_SECRET="$(openssl rand -base64 32)"
CORS_ORIGIN="https://your-domain.com"
```

**替换：**
- `your_password` → 你设置的密码
- `rm-xxxxx.mysql.rds.aliyuncs.com` → 你的 RDS 地址
- `your-domain.com` → 你的域名

---

### ✅ 步骤 5: 部署应用（1 分钟）

```bash
# 部署（会自动执行数据库迁移）
./docker-plus.sh
```

---

## 🔍 快速验证

### 测试数据库连接

```bash
# 方法 1: MySQL 客户端
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u excalidraw -p excalidraw_plus

# 方法 2: Prisma
cd servers/api-service
npx prisma db pull
```

### 查看数据库表

```bash
# 启动 Prisma Studio
cd servers/api-service
npx prisma studio

# 浏览器打开 http://localhost:5555
```

---

## 📋 信息收集表

在开始前，准备好这些信息：

| 项目 | 值 | 示例 |
|------|---|------|
| RDS 地址 | `_____________` | `rm-xxxxx.mysql.rds.aliyuncs.com` |
| 端口 | `3306` | `3306` |
| 数据库名 | `excalidraw_plus` | `excalidraw_plus` |
| 用户名 | `excalidraw` | `excalidraw` |
| 密码 | `_____________` | `YourStrongPassword123!` |
| 服务器 IP | `_____________` | `123.456.789.0` |

---

## ⚠️ 常见错误

### 错误 1: 连接超时
```
✅ 检查白名单是否包含服务器 IP
✅ 测试: telnet rm-xxxxx.mysql.rds.aliyuncs.com 3306
```

### 错误 2: 认证失败
```
✅ 检查用户名和密码
✅ 确认用户已授权访问数据库
```

### 错误 3: 数据库不存在
```
✅ 确认数据库名称正确
✅ 检查: SHOW DATABASES LIKE 'excalidraw_plus';
```

---

## 🎉 完成！

配置完成后：

```bash
# 1. 部署应用
./docker-plus.sh

# 2. 访问应用
https://your-domain.com

# 3. 查看日志
docker-compose logs -f backend
```

---

## 📚 详细文档

需要更多帮助？查看：

- **[RDS_DATABASE_INIT.md](./RDS_DATABASE_INIT.md)** - 详细初始化指南
- **[RDS_MYSQL_SETUP.md](./RDS_MYSQL_SETUP.md)** - 完整配置指南
- **[DUAL_ENVIRONMENT_GUIDE.md](./DUAL_ENVIRONMENT_GUIDE.md)** - 双环境部署

---

**5 分钟配置完成，立即开始使用！** ⚡
