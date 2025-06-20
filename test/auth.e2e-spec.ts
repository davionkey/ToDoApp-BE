import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/test (GET)', () => {
    it('should return auth module status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Auth module is working',
            timestamp: expect.any(String),
            status: 'Phase 2: Authentication implemented successfully',
          });
        });
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            accessToken: expect.any(String),
            user: {
              id: expect.any(String),
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          });
        });
    });

    it('should return 400 for invalid email format', () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: 'StrongP@ssw0rd123',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(invalidUserData)
        .expect(400);
    });

    it('should return 400 for weak password', () => {
      const weakPasswordData = {
        email: 'test2@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(weakPasswordData)
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      const incompleteData = {
        email: 'test3@example.com',
        // missing password
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const userData = {
      email: 'login-test@example.com',
      password: 'StrongP@ssw0rd123',
      firstName: 'Login',
      lastName: 'Test',
    };

    beforeAll(async () => {
      // Register user first
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', () => {
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            accessToken: expect.any(String),
            user: {
              id: expect.any(String),
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          });
        });
    });

    it('should return 401 for invalid credentials', () => {
      const invalidLoginData = {
        email: userData.email,
        password: 'wrong-password',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(invalidLoginData)
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      const nonExistentUserData = {
        email: 'nonexistent@example.com',
        password: 'any-password',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(nonExistentUserData)
        .expect(401);
    });

    it('should return 400 for missing credentials', () => {
      const incompleteData = {
        email: userData.email,
        // missing password
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Register and login to get token
      const userData = {
        email: 'profile-test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'Profile',
        lastName: 'Test',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData);

      accessToken = registerResponse.body.accessToken;
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            email: 'profile-test@example.com',
            firstName: 'Profile',
            lastName: 'Test',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
