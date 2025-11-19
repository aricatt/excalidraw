import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// 测试数据库实例
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/excalidraw_test',
    },
  },
});

// 全局测试设置
beforeAll(async () => {
  // 连接测试数据库
  await testPrisma.$connect();
  
  // 清理并重置数据库
  await testPrisma.$executeRaw`TRUNCATE TABLE "User", "Session", "Drawing", "Collaboration", "Tag", "DrawingTag", "File" RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  // 断开数据库连接
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  // 每个测试前清理数据
  await testPrisma.session.deleteMany();
  await testPrisma.collaboration.deleteMany();
  await testPrisma.drawingTag.deleteMany();
  await testPrisma.drawing.deleteMany();
  await testPrisma.file.deleteMany();
  await testPrisma.tag.deleteMany();
  await testPrisma.user.deleteMany();
});

// 测试工具函数
export const createTestUser = async (data?: Partial<any>) => {
  return testPrisma.user.create({
    data: {
      email: data?.email || 'test@example.com',
      username: data?.username || 'testuser',
      password: data?.password || 'hashedpassword',
      ...data,
    },
  });
};

export const createTestDrawing = async (userId: string, data?: Partial<any>) => {
  return testPrisma.drawing.create({
    data: {
      title: data?.title || 'Test Drawing',
      content: data?.content || '{}',
      userId,
      ...data,
    },
  });
};
