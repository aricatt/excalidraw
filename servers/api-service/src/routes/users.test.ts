import { describe, it, expect, beforeEach } from "vitest";
import { build } from "../test/helper.js";
import {
  testPrisma,
  createTestUser,
} from "../test/setup.js";

describe("User Management API", () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
    // 清理测试数据
    await testPrisma.drawing.deleteMany();
    await testPrisma.session.deleteMany();
    await testPrisma.user.deleteMany();
  });

  describe("GET /api/users/profile", () => {
    it("should get current user profile", async () => {
      // 创建测试用户
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

      // 获取用户资料
      const response = await app.inject({
        method: "GET",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.user.username).toBe(user.username);
      expect(result.user.password).toBeUndefined(); // 不应该返回密码
    });

    it("should return 401 without authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/users/profile",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get public user profile", async () => {
      const user = await createTestUser();

      const response = await app.inject({
        method: "GET",
        url: `/api/users/${user.id}`,
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(user.id);
      expect(result.user.username).toBe(user.username);
      expect(result.user.email).toBeUndefined(); // 不应该返回邮箱
      expect(result.user.password).toBeUndefined(); // 不应该返回密码
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/users/non-existent-id",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PUT /api/users/profile", () => {
    it("should update username", async () => {
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

      // 更新用户名
      const response = await app.inject({
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          username: "newusername",
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.message).toBe("Profile updated successfully");
      expect(result.user.username).toBe("newusername");
    });

    it("should update email", async () => {
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
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          email: "newemail@excalidraw.com",
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.user.email).toBe("newemail@excalidraw.com");
    });

    it("should update password with current password", async () => {
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
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          currentPassword: "password123",
          newPassword: "newpassword123",
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.message).toBe("Profile updated successfully");

      // 验证新密码可以登录
      const newLoginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@excalidraw.com",
          password: "newpassword123",
        },
      });

      expect(newLoginResponse.statusCode).toBe(200);
    });

    it("should reject password change without current password", async () => {
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
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          newPassword: "newpassword123",
        },
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toBe("Current password is required");
    });

    it("should reject password change with wrong current password", async () => {
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
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
        },
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toBe("Current password is incorrect");
    });

    it("should reject duplicate username", async () => {
      // 创建两个用户
      const user1 = await createTestUser();
      const user2 = await createTestUser({
        email: "user2@excalidraw.com",
        username: "user2",
      });
      
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
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          username: "user2", // 尝试使用已存在的用户名
        },
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toBe("Username already taken");
    });

    it("should reject duplicate email", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser({
        email: "user2@excalidraw.com",
        username: "user2",
      });
      
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
        method: "PUT",
        url: "/api/users/profile",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          email: "user2@excalidraw.com", // 尝试使用已存在的邮箱
        },
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toBe("Email already taken");
    });
  });

  describe("PUT /api/users/avatar", () => {
    it("should update user avatar", async () => {
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

      const newAvatarUrl = "https://example.com/new-avatar.png";
      const response = await app.inject({
        method: "PUT",
        url: "/api/users/avatar",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          avatar: newAvatarUrl,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.message).toBe("Avatar updated successfully");
      expect(result.user.avatar).toBe(newAvatarUrl);
    });

    it("should reject invalid avatar URL", async () => {
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
        method: "PUT",
        url: "/api/users/avatar",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          avatar: "not-a-valid-url",
        },
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toBe("Validation error");
    });
  });

  describe("GET /api/users/stats", () => {
    it("should get user statistics", async () => {
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

      // 创建一些测试绘图
      await testPrisma.drawing.createMany({
        data: [
          {
            title: "Public Drawing 1",
            content: { type: "excalidraw", version: 2, elements: [] },
            userId: user.id,
            isPublic: true,
            version: 1,
          },
          {
            title: "Private Drawing 1",
            content: { type: "excalidraw", version: 2, elements: [] },
            userId: user.id,
            isPublic: false,
            version: 1,
          },
          {
            title: "Private Drawing 2",
            content: { type: "excalidraw", version: 2, elements: [] },
            userId: user.id,
            isPublic: false,
            version: 1,
          },
        ],
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/users/stats",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.stats).toBeDefined();
      expect(result.stats.totalDrawings).toBe(3);
      expect(result.stats.publicDrawings).toBe(1);
      expect(result.stats.privateDrawings).toBe(2);
    });
  });
});
