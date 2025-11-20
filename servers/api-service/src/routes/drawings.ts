import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// 验证模式
const createDrawingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.object({
    type: z.literal('excalidraw'),
    version: z.number(),
    source: z.string().optional(),
    elements: z.array(z.any()),
    appState: z.object({}).passthrough(),
  }),
  thumbnail: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const updateDrawingSchema = createDrawingSchema.partial();

const getDrawingsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  isPublic: z.string().transform(Boolean).optional(),
});

// JWT 认证中间件
const requireAuth = async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
};

const drawingRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取用户的绘图列表
  fastify.get('/', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, search, isPublic } = request.query;
      const userId = request.user.userId;
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // 构建查询条件
      const where: any = {
        userId,
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      // 获取绘图列表
      const [drawings, total] = await Promise.all([
        fastify.prisma.drawing.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            isPublic: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limitNum,
        }),
        fastify.prisma.drawing.count({ where }),
      ]);

      return reply.send({
        drawings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 创建新绘图
  fastify.post('/', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      const drawingData = request.body;

      const drawing = await fastify.prisma.drawing.create({
        data: {
          ...drawingData,
          userId,
          version: 1,
        },
        select: {
          id: true,
          title: true,
          description: true,
          content: true,
          thumbnail: true,
          isPublic: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.code(201).send({
        message: 'Drawing created successfully',
        drawing,
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

  // 获取单个绘图
  fastify.get('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;

      const drawing = await fastify.prisma.drawing.findFirst({
        where: {
          id,
          OR: [
            { userId }, // 用户自己的绘图
            { isPublic: true }, // 或公开的绘图
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          content: true,
          thumbnail: true,
          isPublic: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      if (!drawing) {
        return reply.code(404).send({
          error: 'Drawing not found',
        });
      }

      return reply.send({ drawing });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 更新绘图
  fastify.put('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      const updateData = request.body;

      // 检查绘图是否存在且属于当前用户
      const existingDrawing = await fastify.prisma.drawing.findFirst({
        where: { id, userId },
      });

      if (!existingDrawing) {
        return reply.code(404).send({
          error: 'Drawing not found or access denied',
        });
      }

      // 更新绘图
      const drawing = await fastify.prisma.drawing.update({
        where: { id },
        data: {
          ...updateData,
          version: existingDrawing.version + 1,
        },
        select: {
          id: true,
          title: true,
          description: true,
          content: true,
          thumbnail: true,
          isPublic: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({
        message: 'Drawing updated successfully',
        drawing,
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

  // 删除绘图
  fastify.delete('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;

      // 检查绘图是否存在且属于当前用户
      const existingDrawing = await fastify.prisma.drawing.findFirst({
        where: { id, userId },
      });

      if (!existingDrawing) {
        return reply.code(404).send({
          error: 'Drawing not found or access denied',
        });
      }

      // 删除绘图
      await fastify.prisma.drawing.delete({
        where: { id },
      });

      return reply.send({
        message: 'Drawing deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 导出绘图
  fastify.get('/:id/export', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { format = 'json' } = request.query;
      const userId = request.user.userId;

      // 验证导出格式
      if (!['json', 'png', 'svg'].includes(format)) {
        return reply.code(400).send({
          error: 'Invalid export format. Supported formats: json, png, svg',
        });
      }

      // 获取绘图数据
      const drawing = await fastify.prisma.drawing.findFirst({
        where: {
          id,
          OR: [
            { userId }, // 用户自己的绘图
            { isPublic: true }, // 或公开的绘图
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          isPublic: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      if (!drawing) {
        return reply.code(404).send({
          error: 'Drawing not found',
        });
      }

      // 根据格式返回数据
      if (format === 'json') {
        const exportData = {
          type: 'excalidraw',
          version: 2,
          source: 'https://excalidraw.com',
          elements: drawing.content.elements || [],
          appState: drawing.content.appState || {},
          files: null,
        };

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${drawing.title}.excalidraw"`);
        
        return reply.send(exportData);
      } else {
        // 对于 PNG 和 SVG 导出，返回绘图数据供前端处理
        // 实际的图像生成需要在前端使用 Excalidraw 的导出功能
        return reply.send({
          message: `Export format ${format} requires client-side processing`,
          drawingData: {
            elements: drawing.content.elements || [],
            appState: drawing.content.appState || {},
          },
          exportFormat: format,
        });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });
};

export default drawingRoutes;
