import { FastifyPluginAsync } from 'fastify';

const collaborationRoutes: FastifyPluginAsync = async (fastify) => {
  // WebSocket 实时协作
  fastify.register(async function (fastify) {
    fastify.get('/ws/:drawingId', { websocket: true }, (connection, req) => {
      // TODO: 实现实时协作逻辑
      connection.socket.send('Connected to collaboration room');
    });
  });

  // 获取协作者列表
  fastify.get('/:drawingId/collaborators', async (request, reply) => {
    return reply.send({ message: 'Get collaborators - Coming soon' });
  });

  // 添加协作者
  fastify.post('/:drawingId/collaborators', async (request, reply) => {
    return reply.send({ message: 'Add collaborator - Coming soon' });
  });
};

export default collaborationRoutes;
