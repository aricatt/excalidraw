import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
// import staticFiles from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入类型声明
// import './types/fastify.js';

// 导入路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import drawingRoutes from './routes/drawings.js';
import fileRoutes from './routes/files.js';
import collaborationRoutes from './routes/collaboration.js';
import workspaceRoutes from './routes/workspaces.js';
import collectionRoutes from './routes/collections.js';
import tagRoutes from './routes/tags.js';
import commentRoutes from './routes/comments.js';

// 环境变量
const PORT = parseInt(process.env.PORT || '3001');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4417';

// 创建 Fastify 实例
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// 创建 Prisma 客户端
const prisma = new PrismaClient();

// 注册插件
await fastify.register(cors, {
  origin: CORS_ORIGIN,
  credentials: true,
});

await fastify.register(jwt, {
  secret: JWT_SECRET,
});

await fastify.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
});

await fastify.register(websocket);

// await fastify.register(staticFiles, {
//   root: path.join(process.cwd(), 'uploads'),
//   prefix: '/uploads/',
// });

// 添加 Prisma 到 Fastify 实例
fastify.decorate('prisma', prisma);

// 注册路由
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(drawingRoutes, { prefix: '/api/drawings' });
await fastify.register(fileRoutes, { prefix: '/api/files' });
await fastify.register(collaborationRoutes, { prefix: '/api/collaboration' });
await fastify.register(workspaceRoutes, { prefix: '/api/workspaces' });
await fastify.register(collectionRoutes, { prefix: '/api/collections' });
await fastify.register(tagRoutes, { prefix: '/api/tags' });
await fastify.register(commentRoutes, { prefix: '/api' });


// 健康检查
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'excalidraw-plus-api'
  };
});

// 根路径
fastify.get('/', async () => {
  return {
    message: 'Excalidraw Plus API Service',
    version: '1.0.0',
    docs: '/docs'
  };
});

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 API Service running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down API service...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

start();
