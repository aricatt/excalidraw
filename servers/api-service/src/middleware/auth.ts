import { FastifyRequest, FastifyReply } from 'fastify';

// 认证中间件
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 验证 JWT token
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
};

// 可选认证中间件（用于可选登录的端点）
export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    // 不抛出错误，只是不设置用户信息
  }
};
