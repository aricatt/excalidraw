import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// 验证模式
const createTagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

const updateTagSchema = createTagSchema.partial();

// JWT 认证中间件
const requireAuth = async (request: any, reply: any) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
};

const tagRoutes: FastifyPluginAsync = async (fastify) => {
    // 获取所有标签
    fastify.get('/', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const userId = request.user.userId;

            // 获取所有标签
            const tags = await fastify.prisma.tag.findMany({
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
                orderBy: { name: 'asc' },
            });

            // 为每个标签计算当前用户的绘图数量
            const tagsWithCount = await Promise.all(
                tags.map(async (tag) => {
                    const count = await fastify.prisma.drawingTag.count({
                        where: {
                            tagId: tag.id,
                            drawing: {
                                userId: userId,
                            },
                        },
                    });
                    return {
                        ...tag,
                        _count: { drawings: count },
                    };
                })
            );

            return reply.send({ tags: tagsWithCount });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
            });
        }
    });

    // 创建标签
    fastify.post('/', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { name, color } = createTagSchema.parse(request.body);

            // 检查标签是否已存在
            const existing = await fastify.prisma.tag.findUnique({
                where: { name },
            });

            if (existing) {
                return reply.code(400).send({
                    error: 'Tag already exists',
                });
            }

            const tag = await fastify.prisma.tag.create({
                data: { name, color },
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            });

            return reply.code(201).send({
                message: 'Tag created successfully',
                tag,
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

    // 更新标签
    fastify.put('/:id', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const updateData = updateTagSchema.parse(request.body);

            const tag = await fastify.prisma.tag.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            });

            return reply.send({
                message: 'Tag updated successfully',
                tag,
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

    // 删除标签
    fastify.delete('/:id', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;

            await fastify.prisma.tag.delete({
                where: { id },
            });

            return reply.send({
                message: 'Tag deleted successfully',
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
            });
        }
    });
};

export default tagRoutes;
