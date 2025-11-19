import { describe, it, expect, beforeEach } from "vitest";
import { build } from "../test/helper.js";
import {
  testPrisma,
  createTestUser,
  createTestDrawing,
} from "../test/setup.js";

describe("Drawing Routes", () => {
  let app: any;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    app = await build();
    
    // 创建测试用户
    testUser = await createTestUser();
    
    // 获取认证 token
    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: testUser.email,
        password: "hashedpassword", // 这里使用原始密码，因为测试中没有真正加密
      },
    });
    
    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.token;
  });

  describe("POST /api/drawings", () => {
    it("should create a new drawing successfully", async () => {
      const drawingData = {
        title: "Test Drawing",
        description: "A test drawing",
        content: {
          type: "excalidraw",
          version: 2,
          source: "https://excalidraw.com",
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
            gridSize: null,
            viewBackgroundColor: "#ffffff",
          },
        },
        thumbnail: "data:image/png;base64,test",
        isPublic: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/drawings",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: drawingData,
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.message).toBe("Drawing created successfully");
      expect(data.drawing).toBeDefined();
      expect(data.drawing.title).toBe(drawingData.title);
      expect(data.drawing.version).toBe(1);
    });

    it("should reject invalid drawing data", async () => {
      const invalidData = {
        title: "", // 空标题应该被拒绝
        content: {
          type: "invalid", // 无效类型
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/drawings",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe("Validation error");
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/drawings",
        payload: {
          title: "Test",
          content: { type: "excalidraw", version: 2, elements: [], appState: {} },
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/drawings", () => {
    beforeEach(async () => {
      // 创建一些测试绘图
      await createTestDrawing(testUser.id, {
        title: "Drawing 1",
        description: "First drawing",
      });
      await createTestDrawing(testUser.id, {
        title: "Drawing 2", 
        description: "Second drawing",
      });
    });

    it("should get user drawings list", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/drawings",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.drawings).toBeDefined();
      expect(data.drawings.length).toBe(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(2);
    });

    it("should support pagination", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/drawings?page=1&limit=1",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.drawings.length).toBe(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
      expect(data.pagination.totalPages).toBe(2);
    });

    it("should support search", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/drawings?search=First",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.drawings.length).toBe(1);
      expect(data.drawings[0].title).toBe("Drawing 1");
    });
  });

  describe("GET /api/drawings/:id", () => {
    let testDrawing: any;

    beforeEach(async () => {
      testDrawing = await createTestDrawing(testUser.id);
    });

    it("should get drawing by id", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/api/drawings/${testDrawing.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.drawing).toBeDefined();
      expect(data.drawing.id).toBe(testDrawing.id);
      expect(data.drawing.user).toBeDefined();
    });

    it("should return 404 for non-existent drawing", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/drawings/non-existent-id",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PUT /api/drawings/:id", () => {
    let testDrawing: any;

    beforeEach(async () => {
      testDrawing = await createTestDrawing(testUser.id);
    });

    it("should update drawing successfully", async () => {
      const updateData = {
        title: "Updated Drawing",
        description: "Updated description",
      };

      const response = await app.inject({
        method: "PUT",
        url: `/api/drawings/${testDrawing.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.message).toBe("Drawing updated successfully");
      expect(data.drawing.title).toBe(updateData.title);
      expect(data.drawing.version).toBe(testDrawing.version + 1);
    });

    it("should not allow updating other users drawings", async () => {
      // 创建另一个用户的绘图
      const otherUser = await createTestUser("other@test.com", "otheruser");
      const otherDrawing = await createTestDrawing(otherUser.id);

      const response = await app.inject({
        method: "PUT",
        url: `/api/drawings/${otherDrawing.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          title: "Hacked Drawing",
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/drawings/:id", () => {
    let testDrawing: any;

    beforeEach(async () => {
      testDrawing = await createTestDrawing(testUser.id);
    });

    it("should delete drawing successfully", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/api/drawings/${testDrawing.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.message).toBe("Drawing deleted successfully");

      // 验证绘图已被删除
      const deletedDrawing = await testPrisma.drawing.findUnique({
        where: { id: testDrawing.id },
      });
      expect(deletedDrawing).toBeNull();
    });

    it("should not allow deleting other users drawings", async () => {
      // 创建另一个用户的绘图
      const otherUser = await createTestUser("other@test.com", "otheruser");
      const otherDrawing = await createTestDrawing(otherUser.id);

      const response = await app.inject({
        method: "DELETE",
        url: `/api/drawings/${otherDrawing.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
