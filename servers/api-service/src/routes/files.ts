import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { requireAuth } from '../middleware/auth.js';

// 文件上传验证模式
const uploadFileSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB 限制
});

// 绘图导出验证模式
const exportDrawingSchema = z.object({
  format: z.enum(['png', 'svg', 'json']).default('png'),
  scale: z.number().min(0.1).max(5).default(1),
  background: z.boolean().default(true),
});

const fileRoutes: FastifyPluginAsync = async (fastify) => {
  // 确保上传目录存在
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // 文件上传
  fastify.post('/upload', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
        });
      }

      // 验证文件信息
      const fileInfo = {
        filename: data.filename,
        mimetype: data.mimetype,
        size: 0, // 将在写入过程中计算
      };

      // 生成唯一文件名
      const fileExtension = path.extname(data.filename);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      // 保存文件
      const writeStream = createWriteStream(filePath);
      await pipeline(data.file, writeStream);

      // 获取文件大小
      const stats = await fs.stat(filePath);
      fileInfo.size = stats.size;

      // 验证文件大小
      uploadFileSchema.parse(fileInfo);

      // 保存文件记录到数据库
      const userId = request.user.userId;
      const file = await fastify.prisma.file.create({
        data: {
          filename: data.filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          size: stats.size,
          path: filePath,
          userId,
        },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      });

      return reply.code(201).send({
        message: 'File uploaded successfully',
        file,
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

  // 获取文件
  fastify.get('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;

      const file = await fastify.prisma.file.findFirst({
        where: {
          id,
          userId, // 只能访问自己的文件
        },
      });

      if (!file) {
        return reply.code(404).send({
          error: 'File not found',
        });
      }

      // 检查文件是否存在
      try {
        await fs.access(file.path);
      } catch {
        return reply.code(404).send({
          error: 'File not found on disk',
        });
      }

      // 设置响应头
      reply.header('Content-Type', file.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${file.originalName}"`);

      // 发送文件 (暂时返回文件信息，稍后实现文件下载)
      return reply.send({ 
        message: 'File download not implemented yet',
        file: {
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          path: file.path
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 获取用户文件列表
  fastify.get('/', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query;
      const userId = request.user.userId;
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const [files, total] = await Promise.all([
        fastify.prisma.file.findMany({
          where: { userId },
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limitNum,
        }),
        fastify.prisma.file.count({ where: { userId } }),
      ]);

      return reply.send({
        files,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  // 删除文件
  fastify.delete('/:id', {
    preHandler: requireAuth,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;

      const file = await fastify.prisma.file.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!file) {
        return reply.code(404).send({
          error: 'File not found',
        });
      }

      // 删除磁盘文件
      try {
        await fs.unlink(file.path);
      } catch (error) {
        fastify.log.warn(`Failed to delete file from disk: ${file.path}`);
      }

      // 删除数据库记录
      await fastify.prisma.file.delete({
        where: { id },
      });

      return reply.send({
        message: 'File deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });
};

export default fileRoutes;
