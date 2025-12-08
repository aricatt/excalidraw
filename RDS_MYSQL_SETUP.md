# 阿里云 RDS MySQL 配置指南

本指南说明如何配置 Excalidraw Plus 使用阿里云 RDS MySQL 数据库。

## 🎯 为什么使用阿里云 RDS？

- ✅ **成本更低** - 按需付费，无需维护服务器
- ✅ **高可用性** - 自动备份、主从复制
- ✅ **易于扩展** - 随时调整配置
- ✅ **专业运维** - 阿里云负责数据库维护
- ✅ **安全可靠** - 白名单、SSL 连接

---

## 📋 前置准备

### 1. 创建阿里云 RDS MySQL 实例

1. 登录 [阿里云控制台](https://rdsnext.console.aliyun.com/)
2. 选择 **云数据库 RDS** → **MySQL**
3. 点击 **创建实例**

**推荐配置：**
- **版本**: MySQL 8.0
- **系列**: 基础版（开发测试）/ 高可用版（生产环境）
- **规格**: 1核2GB 起步（根据实际需求调整）
- **存储**: 20GB SSD（可扩展）
- **地域**: 选择与应用服务器相同的地域

### 2. 配置 RDS 实例

#### 2.1 设置白名单

在 RDS 控制台 → **数据安全性** → **白名单设置**：

```
# 添加应用服务器的公网 IP
123.456.789.0

# 如果使用阿里云 ECS，可以添加内网 IP（更安全）
172.16.0.0/16

# 本地开发测试（生产环境请删除）
0.0.0.0/0
```

⚠️ **安全提示**: 生产环境不要使用 `0.0.0.0/0`，只添加必要的 IP 地址。

#### 2.2 创建数据库账号

在 RDS 控制台 → **账号管理** → **创建账号**：

```
账号名称: excalidraw
账号类型: 普通账号
密码: [设置强密码]
授权数据库: excalidraw_plus (稍后创建)
权限: 读写
```

#### 2.3 创建数据库

在 RDS 控制台 → **数据库管理** → **创建数据库**：

```
数据库名称: excalidraw_plus
字符集: utf8mb4
排序规则: utf8mb4_unicode_ci
授权账号: excalidraw (读写权限)
```

或者通过 SQL 创建：

```sql
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON excalidraw_plus.* TO 'excalidraw'@'%';
FLUSH PRIVILEGES;
```

---

## 🔧 配置应用连接 RDS

### 1. 获取 RDS 连接信息

在 RDS 控制台 → **基本信息** → **连接信息**：

```
内网地址: rm-xxxxx.mysql.rds.aliyuncs.com
公网地址: rm-xxxxx.mysql.rds.aliyuncs.com (需要申请)
端口: 3306
```

**推荐使用内网地址**（如果应用和 RDS 在同一地域）：
- ✅ 更快的连接速度
- ✅ 免费流量
- ✅ 更安全

### 2. 配置环境变量

#### 方法 1: 使用 .env 文件（推荐）

```bash
# 1. 复制示例文件
cp servers/api-service/.env.example servers/api-service/.env

# 2. 编辑 .env 文件
nano servers/api-service/.env
```

填入以下内容：

```bash
# 阿里云 RDS MySQL 连接
DATABASE_URL="mysql://excalidraw:YOUR_PASSWORD@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"

# JWT 密钥（生产环境必须修改）
JWT_SECRET="your-random-secret-key-at-least-32-characters-long"

# 服务器配置
PORT=6601
NODE_ENV=production

# CORS 配置
CORS_ORIGIN="https://your-domain.com"

# Redis 配置（可选）
# 使用本地 Docker Redis
REDIS_URL="redis://redis:6379"
# 或使用阿里云 Redis
# REDIS_URL="redis://:password@r-xxxxx.redis.rds.aliyuncs.com:6379"
```

#### 方法 2: 使用环境变量

```bash
export DATABASE_URL="mysql://excalidraw:YOUR_PASSWORD@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"
export JWT_SECRET="your-random-secret-key"
export CORS_ORIGIN="https://your-domain.com"
```

### 3. 测试数据库连接

```bash
# 使用 MySQL 客户端测试
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -u excalidraw -p excalidraw_plus

# 或使用 Prisma CLI
cd servers/api-service
npx prisma db pull
```

如果连接成功，说明配置正确！

---

## 🚀 部署步骤

### 1. 初始化数据库（首次部署）

```bash
# 进入 api-service 目录
cd servers/api-service

# 生成 Prisma Client
npx prisma generate

# 创建数据库表结构
npx prisma migrate deploy

# 或者直接推送 schema（开发环境）
npx prisma db push

# 查看数据库（可选）
npx prisma studio
```

### 2. 运行 Docker 部署

```bash
# 返回项目根目录
cd ../..

# 运行部署脚本
./docker-plus.sh

# Windows
docker-plus.bat
```

部署脚本会自动：
1. 检查 `.env` 文件是否存在
2. 构建并启动 Docker 容器
3. 连接到 RDS MySQL
4. 执行数据库迁移
5. 启动所有服务

---

## 🔍 故障排查

### 问题 1: 连接超时

```
Error: Can't reach database server at `rm-xxxxx.mysql.rds.aliyuncs.com:3306`
```

**解决方案：**
1. 检查 RDS 白名单是否包含服务器 IP
2. 检查网络连接：`telnet rm-xxxxx.mysql.rds.aliyuncs.com 3306`
3. 确认使用正确的地址（内网 vs 公网）

### 问题 2: 认证失败

```
Error: Access denied for user 'excalidraw'@'xxx.xxx.xxx.xxx'
```

**解决方案：**
1. 检查用户名和密码是否正确
2. 确认账号已授权访问数据库
3. 检查密码中是否有特殊字符需要转义

### 问题 3: 数据库不存在

```
Error: Unknown database 'excalidraw_plus'
```

**解决方案：**
```sql
-- 登录 RDS 创建数据库
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 问题 4: 迁移失败

```
Error: P3009: migrate found failed migrations
```

**解决方案：**
```bash
# 重置迁移状态
npx prisma migrate reset

# 或删除失败的迁移记录
# 然后重新执行
npx prisma migrate deploy
```

---

## 📊 性能优化

### 1. 连接池配置

在 `DATABASE_URL` 中添加连接池参数：

```bash
DATABASE_URL="mysql://excalidraw:password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus?connection_limit=10&pool_timeout=20"
```

### 2. RDS 参数优化

在 RDS 控制台 → **参数设置**：

```
max_connections = 500
innodb_buffer_pool_size = 70% of RAM
query_cache_size = 0 (MySQL 8.0 已废弃)
```

### 3. 索引优化

```bash
# 查看慢查询
npx prisma studio

# 添加必要的索引（已在 schema.prisma 中定义）
@@index([drawingId])
@@index([userId])
```

---

## 💾 备份策略

### 1. RDS 自动备份

在 RDS 控制台 → **备份恢复** → **备份设置**：

```
备份周期: 每天
备份时间: 凌晨 2:00-3:00（业务低峰期）
保留天数: 7 天（免费）/ 30 天（付费）
```

### 2. 手动备份

```bash
# 导出整个数据库
mysqldump -h rm-xxxxx.mysql.rds.aliyuncs.com \
  -u excalidraw -p \
  excalidraw_plus > backup_$(date +%Y%m%d).sql

# 导出特定表
mysqldump -h rm-xxxxx.mysql.rds.aliyuncs.com \
  -u excalidraw -p \
  excalidraw_plus drawings users > backup_important.sql
```

### 3. 恢复数据

```bash
# 从备份恢复
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com \
  -u excalidraw -p \
  excalidraw_plus < backup_20231208.sql
```

---

## 🔐 安全建议

### 1. 使用 SSL 连接

```bash
# 下载 RDS SSL 证书
wget https://rds-ca-2019.oss-cn-hangzhou.aliyuncs.com/ApsaraDB-CA-Chain.zip

# 配置 DATABASE_URL
DATABASE_URL="mysql://excalidraw:password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus?sslmode=require&sslcert=/path/to/cert.pem"
```

### 2. 定期更换密码

```sql
-- 每 90 天更换一次密码
ALTER USER 'excalidraw'@'%' IDENTIFIED BY 'new_strong_password';
```

### 3. 最小权限原则

```sql
-- 只授予必要的权限
GRANT SELECT, INSERT, UPDATE, DELETE ON excalidraw_plus.* TO 'excalidraw'@'%';
REVOKE ALL PRIVILEGES ON mysql.* FROM 'excalidraw'@'%';
```

### 4. 审计日志

在 RDS 控制台启用 **SQL 审计**，记录所有数据库操作。

---

## 💰 成本优化

### 1. 选择合适的规格

| 场景 | 推荐配置 | 月费用（约） |
|------|---------|------------|
| 开发测试 | 1核2GB 基础版 | ¥100-200 |
| 小型应用 | 2核4GB 高可用版 | ¥300-500 |
| 中型应用 | 4核8GB 高可用版 | ¥800-1200 |

### 2. 使用包年包月

- 包年包月比按量付费便宜 15-30%
- 适合长期稳定运行的应用

### 3. 监控资源使用

在 RDS 控制台 → **监控与报警**：
- CPU 使用率
- 内存使用率
- IOPS
- 连接数

根据实际使用情况调整规格。

---

## 📈 监控和告警

### 1. 配置云监控告警

在阿里云控制台 → **云监控** → **报警规则**：

```
CPU 使用率 > 80%
内存使用率 > 85%
磁盘使用率 > 80%
连接数 > 400
```

### 2. 应用层监控

```typescript
// 在应用中添加数据库连接监控
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// 监控慢查询
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});
```

---

## 🎯 迁移检查清单

部署前确认：

- [ ] RDS 实例已创建并运行
- [ ] 数据库 `excalidraw_plus` 已创建
- [ ] 账号 `excalidraw` 已创建并授权
- [ ] 白名单已添加服务器 IP
- [ ] `.env` 文件已配置正确的 `DATABASE_URL`
- [ ] 测试连接成功
- [ ] 备份策略已配置
- [ ] 监控告警已设置

---

## 📚 相关文档

- [阿里云 RDS MySQL 官方文档](https://help.aliyun.com/product/26090.html)
- [Prisma MySQL 连接指南](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [HTTPS_DEPLOYMENT.md](./HTTPS_DEPLOYMENT.md) - HTTPS 部署指南
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 快速参考

---

## 🆘 获取帮助

如果遇到问题：

1. 查看 RDS 控制台的错误日志
2. 检查应用日志：`docker-compose logs backend`
3. 查看 Prisma 文档：https://www.prisma.io/docs
4. 联系阿里云技术支持

---

## 🎉 完成！

现在你的 Excalidraw Plus 已经成功连接到阿里云 RDS MySQL，享受专业的数据库服务！
