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
  await testPrisma.$executeRaw`TRUNCATE TABLE "users", "sessions", "drawings", "collaborations", "tags", "drawing_tags", "files" RESTART IDENTITY CASCADE`;
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
export const createTestUser = async (
  email = "test@example.com",
  username = "testuser",
  password = "hashedpassword",
) => {
  return testPrisma.user.create({
    data: {
      email,
      username,
      password,
    },
  });
};

export const createTestDrawing = async (
  userId: string,
  data?: Partial<any>,
) => {
  return testPrisma.drawing.create({
    data: {
      title: data?.title || "Test Drawing",
      content: data?.content || {
        type: "excalidraw",
        version: 2,
        elements: [],
        appState: {},
      },
      userId,
      version: 1,
      ...data,
    },
  });
};
