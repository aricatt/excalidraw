import { FastifyPluginAsync } from 'fastify';

const drawingRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取用户的绘图列表
  fastify.get('/', async (request, reply) => {
    return reply.send({ message: 'Get drawings list - Coming soon' });
  });

  // 创建新绘图
  fastify.post('/', async (request, reply) => {
    return reply.send({ message: 'Create drawing - Coming soon' });
  });

  // 获取单个绘图
  fastify.get('/:id', async (request, reply) => {
    return reply.send({ message: 'Get drawing - Coming soon' });
  });

  // 更新绘图
  fastify.put('/:id', async (request, reply) => {
    return reply.send({ message: 'Update drawing - Coming soon' });
  });

  // 删除绘图
  fastify.delete('/:id', async (request, reply) => {
    return reply.send({ message: 'Delete drawing - Coming soon' });
  });
};

export default drawingRoutes;
