import { FastifyPluginAsync } from 'fastify';

const fileRoutes: FastifyPluginAsync = async (fastify) => {
  // 文件上传
  fastify.post('/upload', async (request, reply) => {
    return reply.send({ message: 'File upload - Coming soon' });
  });

  // 获取文件
  fastify.get('/:id', async (request, reply) => {
    return reply.send({ message: 'Get file - Coming soon' });
  });
};

export default fileRoutes;
