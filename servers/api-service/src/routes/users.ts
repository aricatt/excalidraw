import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middleware/auth.js';

// 用户资料更新验证模式
const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional(),
}).refine((data) => {
  // 如果要更改密码，必须提供当前密码
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required when changing password",
  path: ["currentPassword"],
});

// 头像上传验证模式
const avatarUploadSchema = z.object({
  avatar: z.string().url().optional(), // 头像 URL
});

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取当前用户资料
  fastify.get('/profile', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
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

  // 获取指定用户的公开资料
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;

      const user = await fastify.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          avatar: true,
          createdAt: true,
          // 不返回敏感信息如 email
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

  // 更新用户资料
  fastify.put('/profile', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      const updateData = updateProfileSchema.parse(request.body);

      // 获取当前用户信息
      const currentUser = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        return reply.code(404).send({
          error: 'User not found',
        });
      }

      // 检查用户名是否已被占用
      if (updateData.username && updateData.username !== currentUser.username) {
        const existingUser = await fastify.prisma.user.findUnique({
          where: { username: updateData.username },
        });

        if (existingUser) {
          return reply.code(400).send({
            error: 'Username already taken',
          });
        }
      }

      // 检查邮箱是否已被占用
      if (updateData.email && updateData.email !== currentUser.email) {
        const existingUser = await fastify.prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (existingUser) {
          return reply.code(400).send({
            error: 'Email already taken',
          });
        }
      }

      // 验证当前密码（如果要更改密码）
      if (updateData.newPassword) {
        if (!updateData.currentPassword) {
          return reply.code(400).send({
            error: 'Current password is required',
          });
        }

        const isValidPassword = await bcrypt.compare(
          updateData.currentPassword,
          currentUser.password
        );

        if (!isValidPassword) {
          return reply.code(400).send({
            error: 'Current password is incorrect',
          });
        }
      }

      // 准备更新数据
      const dataToUpdate: any = {};
      
      if (updateData.username) {
        dataToUpdate.username = updateData.username;
      }
      
      if (updateData.email) {
        dataToUpdate.email = updateData.email;
      }
      
      if (updateData.newPassword) {
        dataToUpdate.password = await bcrypt.hash(updateData.newPassword, 10);
      }

      // 更新用户信息
      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({
        message: 'Profile updated successfully',
        user: updatedUser,
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

  // 更新用户头像
  fastify.put('/avatar', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      const { avatar } = avatarUploadSchema.parse(request.body);

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: { avatar },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({
        message: 'Avatar updated successfully',
        user: updatedUser,
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

  // 获取用户统计信息
  fastify.get('/stats', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;

      const [drawingsCount, publicDrawingsCount] = await Promise.all([
        fastify.prisma.drawing.count({
          where: { userId },
        }),
        fastify.prisma.drawing.count({
          where: { userId, isPublic: true },
        }),
      ]);

      return reply.send({
        stats: {
          totalDrawings: drawingsCount,
          publicDrawings: publicDrawingsCount,
          privateDrawings: drawingsCount - publicDrawingsCount,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });
};

export default userRoutes;
