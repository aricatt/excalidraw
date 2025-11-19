import Fastify from 'fastify';
import { testPrisma } from './setup';

// 构建测试应用实例
export const build = async () => {
  const app = Fastify({
    logger: false, // 测试时关闭日志
  });

  // 注册插件
  await app.register(import('@fastify/cors'));
  await app.register(import('@fastify/jwt'), {
    secret: 'test-secret-key',
  });

  // 添加测试数据库
  app.decorate('prisma', testPrisma);

  // 注册路由
  await app.register(import('../routes/auth'), { prefix: '/api/auth' });
  await app.register(import('../routes/users'), { prefix: '/api/users' });
  await app.register(import('../routes/drawings'), { prefix: '/api/drawings' });

  return app;
};
