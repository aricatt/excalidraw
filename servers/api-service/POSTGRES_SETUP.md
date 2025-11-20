# PostgreSQL 数据库启动指南

## 方法 1: 使用 Docker Compose (推荐)

这是最简单的方法,已经配置好了。

### 启动数据库
```bash
cd /Users/mac/Gits/_ari_\ excalidraw/servers/api-service
docker-compose -f docker-compose.dev.yml up -d postgres
```

### 检查状态
```bash
docker-compose -f docker-compose.dev.yml ps
```

### 停止数据库
```bash
docker-compose -f docker-compose.dev.yml down
```

### 查看日志
```bash
docker-compose -f docker-compose.dev.yml logs -f postgres
```

## 方法 2: 使用 Homebrew 安装 PostgreSQL

如果你想在本地安装 PostgreSQL:

```bash
# 安装 PostgreSQL
brew install postgresql@15

# 启动服务
brew services start postgresql@15

# 创建数据库
createdb excalidraw_plus_dev
```

## 运行数据库迁移

数据库启动后,运行以下命令创建表结构:

```bash
cd /Users/mac/Gits/_ari_\ excalidraw/servers/api-service

# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate dev --name init

# 或者直接推送 schema (开发环境)
npx prisma db push
```

## 启动 API 服务

```bash
# 安装依赖 (如果还没安装)
npm install

# 启动开发服务器
npm run dev
```

## 验证连接

```bash
# 测试数据库连接
npx prisma db pull
```

## 常见问题

### 端口被占用
如果 5432 端口被占用,可以修改 `docker-compose.dev.yml` 中的端口映射:
```yaml
ports:
  - "5433:5432"  # 使用 5433 端口
```
然后更新 `.env` 中的 `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/excalidraw_plus_dev"
```

### Docker 未安装
如果没有 Docker,请访问 https://www.docker.com/products/docker-desktop 下载安装。
