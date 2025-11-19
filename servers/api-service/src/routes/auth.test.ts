import { describe, it, expect, beforeEach } from 'vitest';
import { build } from '../test/helper';
import { testPrisma, createTestUser } from '../test/setup';

describe('Auth Routes', () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('User registered successfully');
      expect(body.user.email).toBe(userData.email);
      expect(body.user.username).toBe(userData.username);
      expect(body.token).toBeDefined();
      expect(body.user.password).toBeUndefined(); // 密码不应该返回
    });

    it('should reject duplicate email', async () => {
      // 先创建一个用户
      await createTestUser({ email: 'existing@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'existing@example.com',
          username: 'newuser',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('User already exists');
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'invalid-email',
          username: 'ab', // 太短
          password: '123', // 太短
        },
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation error');
      expect(body.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // 创建测试用户（需要真实的密码哈希）
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const user = await createTestUser({
        email: 'test@example.com',
        password: hashedPassword,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Login successful');
      expect(body.user.id).toBe(user.id);
      expect(body.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      await createTestUser({ email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const user = await createTestUser();
      
      // 先登录获取token
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      await testPrisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password: 'password123',
        },
      });

      const { token } = JSON.parse(loginResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.user.id).toBe(user.id);
      expect(body.user.email).toBe(user.email);
    });

    it('should reject request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
