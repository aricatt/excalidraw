import { FastifyPluginAsync } from 'fastify';

// JWT 认证中间件
const requireAuth = async (request: any, reply: any) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
};

const commentRoutes: FastifyPluginAsync = async (fastify) => {
    // 获取绘图的所有评论
    fastify.get('/drawings/:id/comments', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;

            const comments = await fastify.prisma.comment.findMany({
                where: { drawingId: id },
                orderBy: { createdAt: 'asc' },
            });

            return reply.send(comments);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch comments' });
        }
    });

    // 创建评论
    fastify.post('/drawings/:id/comments', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const { content, x, y, elementId, parentId } = request.body;
            const userId = request.user.userId;

            if (!content || !content.trim()) {
                return reply.status(400).send({ error: 'Content is required' });
            }

            // 验证绘图是否存在
            const drawing = await fastify.prisma.drawing.findUnique({
                where: { id },
            });

            if (!drawing) {
                return reply.status(404).send({ error: 'Drawing not found' });
            }

            // 获取用户名
            const user = await fastify.prisma.user.findUnique({
                where: { id: userId },
                select: { username: true },
            });

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            const comment = await fastify.prisma.comment.create({
                data: {
                    drawingId: id,
                    userId,
                    userName: user.username,
                    content: content.trim(),
                    x,
                    y,
                    elementId,
                    parentId,
                },
            });

            return reply.status(201).send(comment);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to create comment' });
        }
    });

    // 更新评论
    fastify.put('/comments/:id', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const { content } = request.body;
            const userId = request.user.userId;

            if (!content || !content.trim()) {
                return reply.status(400).send({ error: 'Content is required' });
            }

            // 验证评论是否存在且属于当前用户
            const existingComment = await fastify.prisma.comment.findUnique({
                where: { id },
            });

            if (!existingComment) {
                return reply.status(404).send({ error: 'Comment not found' });
            }

            if (existingComment.userId !== userId) {
                return reply.status(403).send({ error: 'You can only edit your own comments' });
            }

            const comment = await fastify.prisma.comment.update({
                where: { id },
                data: {
                    content: content.trim(),
                },
            });

            return reply.send(comment);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to update comment' });
        }
    });

    // 删除评论
    fastify.delete('/comments/:id', {
        preHandler: requireAuth,
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.userId;

            // 验证评论是否存在且属于当前用户
            const existingComment = await fastify.prisma.comment.findUnique({
                where: { id },
            });

            if (!existingComment) {
                return reply.status(404).send({ error: 'Comment not found' });
            }

            if (existingComment.userId !== userId) {
                return reply.status(403).send({ error: 'You can only delete your own comments' });
            }

            await fastify.prisma.comment.delete({
                where: { id },
            });

            return reply.status(204).send();
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to delete comment' });
        }
    });
};

export default commentRoutes;
