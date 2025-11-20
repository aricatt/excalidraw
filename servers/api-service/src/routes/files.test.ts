import { describe, it, expect, beforeEach } from "vitest";
import { build } from "../test/helper.js";
import {
  testPrisma,
  createTestUser,
} from "../test/setup.js";

describe("File Management API", () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
    // 清理测试数据
    await testPrisma.file.deleteMany();
    await testPrisma.drawing.deleteMany();
    await testPrisma.session.deleteMany();
    await testPrisma.user.deleteMany();
  });

  describe("GET /api/files", () => {
    it("should get user files list", async () => {
      const user = await createTestUser();
      
      // 登录获取 token
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      // 创建测试文件记录
      await testPrisma.file.create({
        data: {
          filename: "test-file.txt",
          originalName: "test-file.txt",
          mimeType: "text/plain",
          size: 1024,
          path: "/uploads/test-file.txt",
          userId: user.id,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/files",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.files).toBeDefined();
      expect(result.files).toHaveLength(1);
      expect(result.files[0].filename).toBe("test-file.txt");
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
    });

    it("should return empty list for user with no files", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      const response = await app.inject({
        method: "GET",
        url: "/api/files",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.files).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should return 401 without authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/files",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("DELETE /api/files/:id", () => {
    it("should delete user file", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      // 创建测试文件记录
      const file = await testPrisma.file.create({
        data: {
          filename: "test-file.txt",
          originalName: "test-file.txt",
          mimeType: "text/plain",
          size: 1024,
          path: "/uploads/test-file.txt",
          userId: user.id,
        },
      });

      const response = await app.inject({
        method: "DELETE",
        url: `/api/files/${file.id}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.message).toBe("File deleted successfully");

      // 验证文件已被删除
      const deletedFile = await testPrisma.file.findUnique({
        where: { id: file.id },
      });
      expect(deletedFile).toBeNull();
    });

    it("should return 404 for non-existent file", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      const response = await app.inject({
        method: "DELETE",
        url: "/api/files/non-existent-id",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});

describe("Drawing Export API", () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
    // 清理测试数据
    await testPrisma.drawing.deleteMany();
    await testPrisma.session.deleteMany();
    await testPrisma.user.deleteMany();
  });

  describe("GET /api/drawings/:id/export", () => {
    it("should export drawing as JSON", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      // 创建测试绘图
      const drawing = await testPrisma.drawing.create({
        data: {
          title: "Test Drawing",
          content: {
            type: "excalidraw",
            version: 2,
            elements: [
              {
                id: "test-element",
                type: "rectangle",
                x: 100,
                y: 100,
                width: 200,
                height: 100,
              },
            ],
            appState: {
              viewBackgroundColor: "#ffffff",
            },
          },
          userId: user.id,
          version: 1,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: `/api/drawings/${drawing.id}/export?format=json`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.type).toBe("excalidraw");
      expect(result.version).toBe(2);
      expect(result.elements).toBeDefined();
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].id).toBe("test-element");
    });

    it("should return drawing data for PNG/SVG export", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      const drawing = await testPrisma.drawing.create({
        data: {
          title: "Test Drawing",
          content: {
            type: "excalidraw",
            version: 2,
            elements: [],
            appState: {},
          },
          userId: user.id,
          version: 1,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: `/api/drawings/${drawing.id}/export?format=png`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.message).toContain("client-side processing");
      expect(result.drawingData).toBeDefined();
      expect(result.exportFormat).toBe("png");
    });

    it("should return 400 for invalid export format", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      const drawing = await testPrisma.drawing.create({
        data: {
          title: "Test Drawing",
          content: { type: "excalidraw", version: 2, elements: [] },
          userId: user.id,
          version: 1,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: `/api/drawings/${drawing.id}/export?format=invalid`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain("Invalid export format");
    });

    it("should return 404 for non-existent drawing", async () => {
      const user = await createTestUser();
      
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      const response = await app.inject({
        method: "GET",
        url: "/api/drawings/non-existent-id/export",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should allow export of public drawings", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser({
        email: "user2@excalidraw.com",
        username: "user2",
      });
      
      // 用户2登录
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "user2@excalidraw.com",
          password: "password123",
        },
      });

      const { token } = loginResponse.json();

      // 创建用户1的公开绘图
      const drawing = await testPrisma.drawing.create({
        data: {
          title: "Public Drawing",
          content: { type: "excalidraw", version: 2, elements: [] },
          userId: user1.id,
          isPublic: true,
          version: 1,
        },
      });

      // 用户2应该能够导出用户1的公开绘图
      const response = await app.inject({
        method: "GET",
        url: `/api/drawings/${drawing.id}/export`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
