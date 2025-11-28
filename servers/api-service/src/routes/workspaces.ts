import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// 验证模式
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  logo: z.string().optional(),
});

const updateWorkspaceSchema = createWorkspaceSchema.partial();

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

// JWT 认证中间件
const requireAuth = async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
};

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取用户的工作空间列表
  fastify.get('/', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;

      // 获取用户拥有的工作空间和参与的工作空间
      const [ownedWorkspaces, memberWorkspaces] = await Promise.all([
        fastify.prisma.workspace.findMany({
          where: { ownerId: userId },
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { members: true, collections: true },
            },
          },
        }),
        fastify.prisma.workspaceMember.findMany({
          where: { userId },
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                description: true,
                logo: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                  select: { members: true, collections: true },
                },
              },
            },
          },
        }),
      ]);

      const workspaces = [
        ...ownedWorkspaces.map(ws => ({ ...ws, role: 'owner' })),
        ...memberWorkspaces.map(m => ({ ...m.workspace, role: m.role })),
      ];

      return reply.send({ workspaces });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 创建新工作空间
  fastify.post('/', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      const { name, description, logo } = createWorkspaceSchema.parse(request.body);

      const workspace = await fastify.prisma.workspace.create({
        data: {
          name,
          description: description || null,
          logo: logo || null,
          ownerId: userId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 创建默认集合
      await Promise.all([
        fastify.prisma.collection.create({
          data: {
            name: 'Private',
            workspaceId: workspace.id,
            ownerId: userId,
            isDefault: true,
            visibility: 'private',
          },
        }),
        fastify.prisma.collection.create({
          data: {
            name: 'Main',
            workspaceId: workspace.id,
            ownerId: userId,
            isDefault: true,
            visibility: 'team',
          },
        }),
      ]);

      return reply.code(201).send({
        message: 'Workspace created successfully',
        workspace,
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

  // 获取工作空间详情
  fastify.get('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;

      const workspace = await fastify.prisma.workspace.findFirst({
        where: {
          id,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: { members: true, collections: true },
          },
        },
      });

      if (!workspace) {
        return reply.code(404).send({
          error: 'Workspace not found',
        });
      }

      return reply.send({ workspace });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 更新工作空间
  fastify.put('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      const updateData = updateWorkspaceSchema.parse(request.body);

      // 检查权限（只有 owner 和 admin 可以更新）
      const workspace = await fastify.prisma.workspace.findFirst({
        where: {
          id,
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: { in: ['admin'] } } } },
          ],
        },
      });

      if (!workspace) {
        return reply.code(404).send({
          error: 'Workspace not found or access denied',
        });
      }

      // 过滤掉 undefined 的字段
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      const updated = await fastify.prisma.workspace.update({
        where: { id },
        data: cleanUpdateData,
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({
        message: 'Workspace updated successfully',
        workspace: updated,
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

  // 邀请成员
  fastify.post('/:id/invite', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      const { email, role } = inviteMemberSchema.parse(request.body);

      // 检查权限
      const workspace = await fastify.prisma.workspace.findFirst({
        where: {
          id,
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: { in: ['admin'] } } } },
          ],
        },
      });

      if (!workspace) {
        return reply.code(404).send({
          error: 'Workspace not found or access denied',
        });
      }

      // 生成邀请 token
      const token = fastify.jwt.sign({ workspaceId: id, email, role }, { expiresIn: '7d' });

      // 创建邀请记录
      const invitation = await fastify.prisma.workspaceInvitation.create({
        data: {
          workspaceId: id,
          email,
          role,
          token,
          invitedBy: userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        select: {
          id: true,
          email: true,
          role: true,
          token: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      return reply.code(201).send({
        message: 'Invitation created successfully',
        invitation,
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

  // 获取成员列表
  fastify.get('/:id/members', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;

      // 检查访问权限
      const workspace = await fastify.prisma.workspace.findFirst({
        where: {
          id,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      });

      if (!workspace) {
        return reply.code(404).send({
          error: 'Workspace not found or access denied',
        });
      }

      const members = await fastify.prisma.workspaceMember.findMany({
        where: { workspaceId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return reply.send({ members });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });
};

export default workspaceRoutes;
