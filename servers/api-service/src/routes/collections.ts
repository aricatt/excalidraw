import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// 验证模式
const createCollectionSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    workspaceId: z.string(),
    visibility: z.enum(['private', 'team', 'public']).default('private'),
    color: z.string().optional(),
});

const updateCollectionSchema = createCollectionSchema.partial().omit({ workspaceId: true });

// JWT 认证中间件
const requireAuth = async (request: any, reply: any) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
};

const collectionRoutes: FastifyPluginAsync = async(fastify) => {
    // 获取集合列表
    fastify.get('/', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const userId = request.user.userId;
            const { workspaceId } = request.query;

            if (!workspaceId) {
                return reply.code(400).send({
                    error: 'workspaceId is required',
                });
            }

            // 检查用户是否有权限访问该工作空间
            const workspace = await fastify.prisma.workspace.findFirst({
                where: {
                    id: workspaceId,
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

            const collections = await fastify.prisma.collection.findMany({
                where: { workspaceId },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    visibility: true,
                    color: true,
                    isDefault: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { drawings: true },
                    },
                },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'asc' },
                ],
            });

            return reply.send({ collections });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
            });
        }
    });

    // 创建集合
    fastify.post('/', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const userId = request.user.userId;
            const { name, description, workspaceId, visibility, color } = createCollectionSchema.parse(request.body);

            // 检查权限
            const workspace = await fastify.prisma.workspace.findFirst({
                where: {
                    id: workspaceId,
                    OR: [
                        { ownerId: userId },
                        { members: { some: { userId, role: { in: ['admin', 'member'] } } } },
                    ],
                },
            });

            if (!workspace) {
                return reply.code(404).send({
                    error: 'Workspace not found or access denied',
                });
            }

            const collection = await fastify.prisma.collection.create({
                data: {
                    name,
                    description,
                    workspaceId,
                    ownerId: userId,
                    visibility,
                    color,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    visibility: true,
                    color: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return reply.code(201).send({
                message: 'Collection created successfully',
                collection,
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

    // 更新集合
    fastify.put('/:id', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.userId;
            const updateData = updateCollectionSchema.parse(request.body);

            // 检查权限
            const collection = await fastify.prisma.collection.findFirst({
                where: {
                    id,
                    workspace: {
                        OR: [
                            { ownerId: userId },
                            { members: { some: { userId, role: { in: ['admin', 'member'] } } } },
                        ],
                    },
                },
            });

            if (!collection) {
                return reply.code(404).send({
                    error: 'Collection not found or access denied',
                });
            }

            // 不允许修改默认集合的某些属性
            if (collection.isDefault && (updateData.name || updateData.visibility)) {
                return reply.code(400).send({
                    error: 'Cannot modify name or visibility of default collections',
                });
            }

            const updated = await fastify.prisma.collection.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    visibility: true,
                    color: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return reply.send({
                message: 'Collection updated successfully',
                collection: updated,
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

    // 删除集合
    fastify.delete('/:id', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.userId;

            // 检查权限
            const collection = await fastify.prisma.collection.findFirst({
                where: {
                    id,
                    workspace: {
                        OR: [
                            { ownerId: userId },
                            { members: { some: { userId, role: { in: ['admin'] } } } },
                        ],
                    },
                },
            });

            if (!collection) {
                return reply.code(404).send({
                    error: 'Collection not found or access denied',
                });
            }

            // 不允许删除默认集合
            if (collection.isDefault) {
                return reply.code(400).send({
                    error: 'Cannot delete default collections',
                });
            }

            await fastify.prisma.collection.delete({
                where: { id },
            });

            return reply.send({
                message: 'Collection deleted successfully',
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
            });
        }
    });
};

export default collectionRoutes;
