# 🎯 双环境部署速查表

## 快速命令

### 本地开发环境 🛠️

```bash
# 启动
./docker-dev.sh                                    # Linux/macOS
docker-dev.bat                                     # Windows

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 访问数据库
docker-compose -f docker-compose.dev.yml exec mysql mysql -u excalidraw -p
# 密码: excalidraw_password

# 重置数据库
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# 停止
docker-compose -f docker-compose.dev.yml down

# 停止并删除数据
docker-compose -f docker-compose.dev.yml down -v
```

### 生产环境 🚀

```bash
# 配置（首次）
cp servers/api-service/.env.example servers/api-service/.env
nano servers/api-service/.env

# 启动
./docker-plus.sh                                   # Linux/macOS
docker-plus.bat                                    # Windows

# 查看日志
docker-compose logs -f

# 重启后端
docker-compose restart backend

# 停止
docker-compose down
```

---

## 配置对比

| 项目 | 本地开发 | 生产环境 |
|------|---------|---------|
| **配置文件** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **数据库** | MySQL 容器 | 阿里云 RDS |
| **连接字符串** | `mysql://excalidraw:excalidraw_password@mysql:3306/excalidraw_plus` | `mysql://user:pass@rm-xxx.mysql.rds.aliyuncs.com:3306/excalidraw_plus` |
| **需要 .env** | ❌ 否 | ✅ 是 |
| **数据持久化** | Docker Volume | RDS 管理 |

---

## 访问地址

两种环境访问地址相同：

- 🏠 前端: `https://localhost` (开发) / `https://your-domain.com` (生产)
- 🔌 API: `https://localhost/api`
- 🎤 语音: `https://localhost/voice`

---

## 文件结构

```
.
├── docker-compose.dev.yml      # 本地开发配置
├── docker-compose.yml          # 生产环境配置
├── docker-dev.sh              # 本地开发脚本 (Linux/macOS)
├── docker-dev.bat             # 本地开发脚本 (Windows)
├── docker-plus.sh             # 生产环境脚本 (Linux/macOS)
├── docker-plus.bat            # 生产环境脚本 (Windows)
└── servers/api-service/
    ├── .env.example           # 环境变量模板
    └── .env                   # 生产环境配置（需创建）
```

---

## 常见任务

### 切换环境

```bash
# 从开发切换到生产
docker-compose -f docker-compose.dev.yml down
./docker-plus.sh

# 从生产切换到开发
docker-compose down
./docker-dev.sh
```

### 数据备份

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml exec mysql mysqldump \
  -u excalidraw -pexcalidraw_password excalidraw_plus > backup.sql

# 生产环境（RDS 自动备份，也可手动）
mysqldump -h rm-xxx.mysql.rds.aliyuncs.com \
  -u excalidraw -p excalidraw_plus > backup.sql
```

### 查看服务状态

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml ps

# 生产环境
docker-compose ps
```

---

## 故障排查

### 开发环境

```bash
# MySQL 无法启动
docker-compose -f docker-compose.dev.yml logs mysql
docker-compose -f docker-compose.dev.yml down -v  # 删除数据重试

# 迁移失败
docker-compose -f docker-compose.dev.yml exec backend npx prisma db push
```

### 生产环境

```bash
# 连接 RDS 失败
cat servers/api-service/.env                      # 检查配置
telnet rm-xxx.mysql.rds.aliyuncs.com 3306        # 测试连接

# 环境变量未生效
docker-compose restart backend
docker-compose exec backend env | grep DATABASE
```

---

## 详细文档

- 📖 [DUAL_ENVIRONMENT_GUIDE.md](./DUAL_ENVIRONMENT_GUIDE.md) - 完整指南
- 🗄️ [RDS_MYSQL_SETUP.md](./RDS_MYSQL_SETUP.md) - RDS 配置
- 🚀 [QUICK_START.md](./QUICK_START.md) - 快速开始
