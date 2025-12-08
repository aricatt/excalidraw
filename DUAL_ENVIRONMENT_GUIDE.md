# 🔄 双环境部署指南

本项目支持两种部署模式：**本地开发环境**和**生产环境**，使用不同的配置和脚本。

---

## 📋 两种部署模式对比

| 特性 | 本地开发环境 | 生产环境 |
|------|-------------|---------|
| **数据库** | Docker MySQL 容器 | 阿里云 RDS MySQL |
| **配置文件** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **部署脚本** | `docker-dev.sh` / `docker-dev.bat` | `docker-plus.sh` / `docker-plus.bat` |
| **数据持久化** | Docker Volume | RDS 自动管理 |
| **备份** | 手动 | RDS 自动备份 |
| **成本** | 免费（本地资源） | 按需付费 |
| **适用场景** | 开发、测试 | 生产部署 |

---

## 🛠️ 本地开发环境

### 特点

- ✅ **完全自包含** - 所有服务都在 Docker 中
- ✅ **快速启动** - 无需配置外部服务
- ✅ **数据隔离** - 不影响生产数据
- ✅ **易于重置** - 可以随时清空数据重新开始

### 架构

```
┌─────────────────────────────────────┐
│         Docker Compose              │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │ Caddy  │  │Frontend│  │Backend ││
│  └────────┘  └────────┘  └───┬────┘│
│                              │     │
│  ┌────────┐  ┌────────┐     │     │
│  │ MySQL  │  │ Redis  │◄────┘     │
│  └────────┘  └────────┘            │
└─────────────────────────────────────┘
```

### 使用方法

#### 1. 启动开发环境

```bash
# Linux/macOS
./docker-dev.sh

# Windows
docker-dev.bat
```

#### 2. 访问应用

- 前端: `https://localhost`
- API: `https://localhost/api`
- 语音: `https://localhost/voice`

#### 3. 开发工具

```bash
# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f backend

# 访问 MySQL
docker-compose -f docker-compose.dev.yml exec mysql mysql -u excalidraw -p
# 密码: excalidraw_password

# 使用 Prisma Studio
cd servers/api-service
npx prisma studio

# 重置数据库
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# 停止服务
docker-compose -f docker-compose.dev.yml down

# 停止并删除数据
docker-compose -f docker-compose.dev.yml down -v
```

#### 4. 数据库连接信息

```
主机: localhost (容器内为 mysql)
端口: 3306
数据库: excalidraw_plus
用户名: excalidraw
密码: excalidraw_password
```

---

## 🚀 生产环境

### 特点

- ✅ **专业数据库** - 使用阿里云 RDS MySQL
- ✅ **高可用性** - 自动备份和主从复制
- ✅ **易于扩展** - 控制台一键升级
- ✅ **成本优化** - 按需付费，无需维护

### 架构

```
┌─────────────────────────────────────┐
│         Docker Compose              │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │ Caddy  │  │Frontend│  │Backend ││
│  └────────┘  └────────┘  └───┬────┘│
│                              │     │
│  ┌────────┐                  │     │
│  │ Redis  │◄─────────────────┘     │
│  └────────┘                        │
└──────────────────┬──────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  阿里云 RDS MySQL │
        │  - 自动备份       │
        │  - 高可用         │
        │  - 易扩展         │
        └──────────────────┘
```

### 使用方法

#### 1. 配置 RDS（首次）

详见：[RDS_MYSQL_SETUP.md](./RDS_MYSQL_SETUP.md)

```sql
-- 在 RDS 中创建数据库
CREATE DATABASE excalidraw_plus 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'excalidraw'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON excalidraw_plus.* TO 'excalidraw'@'%';
FLUSH PRIVILEGES;
```

#### 2. 配置环境变量

```bash
# 复制配置文件
cp servers/api-service/.env.example servers/api-service/.env

# 编辑配置
nano servers/api-service/.env
```

填入：
```bash
DATABASE_URL="mysql://excalidraw:password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus"
JWT_SECRET="your-random-secret-key"
CORS_ORIGIN="https://your-domain.com"
```

#### 3. 部署应用

```bash
# Linux/macOS
./docker-plus.sh

# Windows
docker-plus.bat
```

#### 4. 管理命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart backend

# 停止服务
docker-compose down

# 更新代码后重新部署
git pull
./docker-plus.sh
```

---

## 🔄 环境切换

### 从开发环境切换到生产环境

```bash
# 1. 停止开发环境
docker-compose -f docker-compose.dev.yml down

# 2. 配置生产环境 .env
cp servers/api-service/.env.example servers/api-service/.env
# 编辑 .env，填入 RDS 连接信息

# 3. 启动生产环境
./docker-plus.sh
```

### 从生产环境切换到开发环境

```bash
# 1. 停止生产环境
docker-compose down

# 2. 启动开发环境
./docker-dev.sh
```

---

## 📊 配置文件对比

### docker-compose.dev.yml (开发环境)

```yaml
backend:
  environment:
    # 使用容器内的 MySQL
    - DATABASE_URL=mysql://excalidraw:excalidraw_password@mysql:3306/excalidraw_plus
  depends_on:
    - mysql  # 依赖 MySQL 容器

mysql:
  image: mysql:8.0
  volumes:
    - mysql_data:/var/lib/mysql
```

### docker-compose.yml (生产环境)

```yaml
backend:
  environment:
    # 使用外部 RDS MySQL
    - DATABASE_URL=${DATABASE_URL}
  env_file:
    - ./servers/api-service/.env
  # 不依赖 mysql 容器

# 没有 mysql 服务定义
```

---

## 🎯 最佳实践

### 开发流程

1. **本地开发**
   ```bash
   ./docker-dev.sh
   # 在 https://localhost 上开发和测试
   ```

2. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

3. **部署到生产**
   ```bash
   # 在生产服务器上
   git pull
   ./docker-plus.sh
   ```

### 数据迁移

#### 从开发环境导出数据

```bash
# 导出开发环境数据
docker-compose -f docker-compose.dev.yml exec mysql mysqldump \
  -u excalidraw -pexcalidraw_password excalidraw_plus > dev_backup.sql
```

#### 导入到生产环境

```bash
# 导入到 RDS
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com \
  -u excalidraw -p excalidraw_plus < dev_backup.sql
```

### 环境隔离

建议使用不同的配置：

```bash
# 开发环境
JWT_SECRET="dev_secret_not_for_production"
CORS_ORIGIN="https://localhost"

# 生产环境
JWT_SECRET="production_secret_very_long_and_random"
CORS_ORIGIN="https://your-domain.com"
```

---

## 🔍 故障排查

### 开发环境问题

#### MySQL 启动失败

```bash
# 查看 MySQL 日志
docker-compose -f docker-compose.dev.yml logs mysql

# 常见原因：
# 1. 端口 3306 被占用
# 2. 数据卷损坏

# 解决方案：删除数据卷重新启动
docker-compose -f docker-compose.dev.yml down -v
./docker-dev.sh
```

#### 数据库迁移失败

```bash
# 重置数据库
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# 或直接推送 schema
docker-compose -f docker-compose.dev.yml exec backend npx prisma db push
```

### 生产环境问题

#### 连接 RDS 失败

```bash
# 检查白名单
# 在 RDS 控制台确认服务器 IP 已添加

# 测试连接
telnet rm-xxxxx.mysql.rds.aliyuncs.com 3306

# 检查 .env 配置
cat servers/api-service/.env
```

#### 环境变量未生效

```bash
# 确认 .env 文件存在
ls -la servers/api-service/.env

# 重启后端服务
docker-compose restart backend

# 查看环境变量
docker-compose exec backend env | grep DATABASE
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [RDS_MYSQL_SETUP.md](./RDS_MYSQL_SETUP.md) | 阿里云 RDS 详细配置 |
| [MYSQL_MIGRATION_SUMMARY.md](./MYSQL_MIGRATION_SUMMARY.md) | MySQL 迁移总结 |
| [HTTPS_DEPLOYMENT.md](./HTTPS_DEPLOYMENT.md) | HTTPS 部署指南 |
| [QUICK_START.md](./QUICK_START.md) | 快速开始 |

---

## 🎉 总结

### 开发环境（本地测试）

```bash
# 一键启动，包含完整的 MySQL 容器
./docker-dev.sh

# 访问
https://localhost
```

### 生产环境（线上部署）

```bash
# 配置 RDS 连接
nano servers/api-service/.env

# 一键部署，使用外部 RDS
./docker-plus.sh

# 访问
https://your-domain.com
```

**两种模式，灵活切换，开发和生产完美隔离！** 🚀
