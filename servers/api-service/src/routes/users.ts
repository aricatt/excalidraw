import { FastifyPluginAsync } from 'fastify';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取用户资料
  fastify.get('/:id', async (request, reply) => {
    // TODO: 实现用户资料获取
    return reply.send({ message: 'Get user profile - Coming soon' });
  });

  // 更新用户资料
  fastify.put('/:id', async (request, reply) => {
    // TODO: 实现用户资料更新
    return reply.send({ message: 'Update user profile - Coming soon' });
  });
};

export default userRoutes;
