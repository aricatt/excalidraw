# 🎉 Excalidraw Plus API 服务已成功启动!

## ✅ 当前状态

- **API 服务**: ✅ 运行中 (http://localhost:6602)
- **PostgreSQL**: ✅ 运行中 (localhost:5432)
- **Redis**: ✅ 运行中 (localhost:6379)
- **数据库迁移**: ✅ 已完成

## 🚀 可用的 API 端点

### 认证 (`/api/auth`)
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户

### 工作空间 (`/api/workspaces`)
- `GET /api/workspaces` - 获取工作空间列表
- `POST /api/workspaces` - 创建工作空间
- `GET /api/workspaces/:id` - 获取工作空间详情
- `PUT /api/workspaces/:id` - 更新工作空间
- `POST /api/workspaces/:id/invite` - 邀请成员
- `GET /api/workspaces/:id/members` - 获取成员列表

### 集合 (`/api/collections`)
- `GET /api/collections?workspaceId=xxx` - 获取集合列表
- `POST /api/collections` - 创建集合
- `PUT /api/collections/:id` - 更新集合
- `DELETE /api/collections/:id` - 删除集合

### 标签 (`/api/tags`)
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签

### 绘图 (`/api/drawings`)
- `GET /api/drawings` - 获取绘图列表
- `POST /api/drawings` - 创建绘图
- `GET /api/drawings/:id` - 获取绘图详情
- `PUT /api/drawings/:id` - 更新绘图
- `DELETE /api/drawings/:id` - 删除绘图
- `GET /api/drawings/:id/export` - 导出绘图

### 用户 (`/api/users`)
- `GET /api/users/profile` - 获取个人资料
- `PUT /api/users/profile` - 更新个人资料

## 📝 快速测试

### 1. 注册用户
```bash
curl -X POST http://localhost:6602/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### 2. 登录
```bash
curl -X POST http://localhost:6602/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. 创建工作空间 (需要 token)
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:6602/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Workspace",
    "description": "Test workspace"
  }'
```

## 🛠️ 常用命令

### 查看服务状态
```bash
docker-compose -f docker-compose.dev.yml ps
```

### 查看日志
```bash
# API 服务日志 (在运行 npm run dev 的终端)
# PostgreSQL 日志
docker-compose -f docker-compose.dev.yml logs -f postgres
# Redis 日志
docker-compose -f docker-compose.dev.yml logs -f redis
```

### 停止服务
```bash
# 停止 API 服务: Ctrl+C
# 停止数据库
docker-compose -f docker-compose.dev.yml down
```

### 重启服务
```bash
# 启动数据库
docker-compose -f docker-compose.dev.yml up -d
# 启动 API
npm run dev
```

### 数据库操作
```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma migrate reset

# 查看迁移状态
npx prisma migrate status
```

## 🐛 故障排除

### 端口被占用
如果 6602 端口被占用,修改 `.env` 中的 `PORT` 值。

### 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
docker-compose -f docker-compose.dev.yml ps postgres

# 重启 PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres
```

### 清理并重新开始
```bash
# 停止所有服务
docker-compose -f docker-compose.dev.yml down -v

# 重新启动
./start.sh
```

## 📚 下一步

1. ✅ 数据库和 API 已启动
2. 🔄 开发前端应用连接到 API
3. 🧪 编写测试用例
4. 📖 完善 API 文档

---
*生成时间: 2025-11-20*
