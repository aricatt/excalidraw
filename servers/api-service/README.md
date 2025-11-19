# Excalidraw Plus API Service

统一的 API 服务，为 Excalidraw Plus 提供后端功能支持。

## 🚀 技术栈

- **Fastify** - 高性能 Node.js Web 框架
- **Prisma** - 现代化数据库 ORM
- **PostgreSQL** - 主数据库
- **JWT** - 用户认证
- **Zod** - 数据验证
- **TypeScript** - 类型安全

## 📁 项目结构

```
api-service/
├── src/
│   ├── routes/           # API 路由
│   │   ├── auth.ts       # 用户认证
│   │   ├── users.ts      # 用户管理
│   │   ├── drawings.ts   # 绘图数据
│   │   ├── files.ts      # 文件管理
│   │   └── collaboration.ts # 实时协作
│   └── index.ts          # 服务入口
├── prisma/
│   └── schema.prisma     # 数据库模型
├── package.json
├── tsconfig.json
└── .env.example
```

## 🛠️ 开发指南

### 环境准备

1. **安装依赖**
   ```bash
   cd servers/api-service
   npm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接等
   ```

3. **数据库设置**
   ```bash
   # 生成 Prisma 客户端
   npm run db:generate
   
   # 推送数据库模式
   npm run db:push
   
   # 或运行迁移
   npm run db:migrate
   ```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 `http://localhost:3001` 启动。

## 📚 API 文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理

- `GET /api/users/:id` - 获取用户资料
- `PUT /api/users/:id` - 更新用户资料

### 绘图管理

- `GET /api/drawings` - 获取绘图列表
- `POST /api/drawings` - 创建新绘图
- `GET /api/drawings/:id` - 获取单个绘图
- `PUT /api/drawings/:id` - 更新绘图
- `DELETE /api/drawings/:id` - 删除绘图

### 文件管理

- `POST /api/files/upload` - 文件上传
- `GET /api/files/:id` - 获取文件

### 实时协作

- `WS /api/collaboration/ws/:drawingId` - WebSocket 连接
- `GET /api/collaboration/:drawingId/collaborators` - 获取协作者
- `POST /api/collaboration/:drawingId/collaborators` - 添加协作者

## 🗄️ 数据库模型

### 核心表

- **users** - 用户信息
- **sessions** - 用户会话
- **drawings** - 绘图数据
- **collaborations** - 协作关系
- **tags** - 标签系统
- **files** - 文件存储

### 关系设计

- 用户 ↔ 绘图 (一对多)
- 绘图 ↔ 协作 (一对多)
- 绘图 ↔ 标签 (多对多)

## 🔧 开发工具

```bash
# 数据库可视化
npm run db:studio

# 代码检查
npm run lint

# 运行测试
npm test
```

## 🚀 部署

### Docker 部署

```dockerfile
# Dockerfile 示例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### 环境变量

生产环境需要配置：

- `DATABASE_URL` - PostgreSQL 连接字符串
- `JWT_SECRET` - JWT 密钥
- `CORS_ORIGIN` - 前端域名
- `NODE_ENV=production`

## 📝 开发规范

1. **路由组织** - 按功能模块分离路由文件
2. **错误处理** - 统一的错误响应格式
3. **数据验证** - 使用 Zod 进行输入验证
4. **类型安全** - 充分利用 TypeScript
5. **日志记录** - 使用 Fastify 内置日志

## 🔄 版本历史

- **v1.0.0** - 基础架构和认证系统
- **Coming Soon** - 完整的绘图和协作功能

---

**注意**: 这是一个统一的 API 服务，包含了 Excalidraw Plus 的所有后端功能。遵循单体架构设计，便于独立开发者维护和部署。
