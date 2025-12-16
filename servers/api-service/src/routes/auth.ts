import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 验证模式
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 注册
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, username, password } = registerSchema.parse(request.body);

      // 白名单检查 (默认拒绝)
      const allowedEmailsEnv = process.env.ALLOWED_EMAILS;

      if (!allowedEmailsEnv) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'Registration is disabled.',
        });
      }

      const allowedEmails = allowedEmailsEnv.split(',').map(e => e.trim());
      if (!allowedEmails.includes(email)) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'This email is not authorized to register.',
        });
      }

      // 检查用户是否已存在
      const existingUser = await fastify.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return reply.code(400).send({
          error: 'User already exists',
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);

      // 创建用户
      const user = await fastify.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true,
        },
      });

      // 生成 JWT
      const token = fastify.jwt.sign({ userId: user.id });

      return reply.send({
        message: 'User registered successfully',
        user,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 登录
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // 查找用户
      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // 生成 JWT
      const token = fastify.jwt.sign({ userId: user.id });

      // 创建会话记录
      await fastify.prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
        },
      });

      return reply.send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 登出
  fastify.post('/logout', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  }, async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');

      if (token) {
        // 删除会话记录
        await fastify.prisma.session.deleteMany({
          where: { token },
        });
      }

      return reply.send({
        message: 'Logout successful',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 获取当前用户信息
  fastify.get('/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).userId;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
        });
      }

      return reply.send({ user });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });
};

export default authRoutes;
