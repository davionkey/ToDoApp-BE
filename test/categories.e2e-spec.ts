import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login to get access token
    const userData = {
      email: 'categories-test@example.com',
      password: 'StrongP@ssw0rd123',
      firstName: 'Categories',
      lastName: 'Test',
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userData);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/categories/test (GET)', () => {
    it('should return categories module status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Categories module is working',
            timestamp: expect.any(String),
            status: 'Phase 4: Enhanced Features implemented successfully',
          });
        });
    });
  });

  describe('/categories (POST)', () => {
    it('should create a category successfully', () => {
      const categoryData = {
        name: 'Work',
        description: 'Work related tasks',
        color: '#FF0000',
      };

      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            name: categoryData.name,
            description: categoryData.description,
            color: categoryData.color,
            userId: userId,
            tasks: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('should create a minimal category with only name', () => {
      const minimalCategoryData = {
        name: 'Personal',
      };

      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(minimalCategoryData)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(minimalCategoryData.name);
          expect(res.body.description).toBeNull();
          expect(res.body.color).toBeNull();
        });
    });

    it('should return 400 for missing name', () => {
      const invalidCategoryData = {
        description: 'Category without name',
      };

      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidCategoryData)
        .expect(400);
    });

    it('should return 409 for duplicate category name', () => {
      const duplicateCategoryData = {
        name: 'Work', // This should already exist from first test
        description: 'Duplicate work category',
      };

      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(duplicateCategoryData)
        .expect(409);
    });

    it('should return 401 without authentication', () => {
      const categoryData = {
        name: 'Unauthorized Category',
      };

      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .send(categoryData)
        .expect(401);
    });
  });

  describe('/categories (GET)', () => {
    let createdCategoryIds: string[] = [];

    beforeAll(async () => {
      // Create multiple categories for testing
      const categories = [
        { name: 'Health', description: 'Health and fitness', color: '#00FF00' },
        { name: 'Finance', description: 'Financial tasks', color: '#0000FF' },
        { name: 'Shopping', description: 'Shopping lists', color: '#FFFF00' },
        {
          name: 'Important Tasks',
          description: 'High priority tasks',
          color: '#FF00FF',
        },
      ];

      for (const category of categories) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(category);
        createdCategoryIds.push(response.body.id);
      }
    });

    it('should return paginated categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            data: expect.any(Array),
            meta: {
              total: expect.any(Number),
              page: 1,
              limit: 10,
              totalPages: expect.any(Number),
            },
          });
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should search categories by name', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories?search=Important')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.data.some((cat: any) => cat.name.includes('Important')),
          ).toBe(true);
        });
    });

    it('should handle pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeLessThanOrEqual(2);
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(2);
        });
    });

    it('should handle sorting', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories?sortBy=name&sortOrder=ASC')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/categories').expect(401);
    });
  });

  describe('/categories/stats (GET)', () => {
    it('should return category statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            totalCategories: expect.any(Number),
            categoriesWithTasks: expect.any(Number),
            averageTasksPerCategory: expect.any(Number),
          });
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/stats')
        .expect(401);
    });
  });

  describe('/categories/:id (GET)', () => {
    let categoryId: string;

    beforeAll(async () => {
      const categoryData = {
        name: 'Single Category Test',
        description: 'Test Description',
        color: '#123456',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryData);

      categoryId = response.body.id;
    });

    it('should return a specific category', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(categoryId);
          expect(res.body.name).toBe('Single Category Test');
        });
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .expect(401);
    });
  });

  describe('/categories/:id (PATCH)', () => {
    let categoryId: string;

    beforeAll(async () => {
      const categoryData = {
        name: 'Update Category Test',
        description: 'Original Description',
        color: '#AAAAAA',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryData);

      categoryId = response.body.id;
    });

    it('should update a category successfully', () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated Description',
        color: '#BBBBBB',
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.description).toBe(updateData.description);
          expect(res.body.color).toBe(updateData.color);
        });
    });

    it('should update partial category data', () => {
      const partialUpdateData = {
        description: 'Partially Updated Description',
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(partialUpdateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe(partialUpdateData.description);
          expect(res.body.name).toBe('Updated Category Name'); // Should remain unchanged
        });
    });

    it('should return 409 when updating to existing name', () => {
      const conflictUpdateData = {
        name: 'Work', // This name should already exist
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(conflictUpdateData)
        .expect(409);
    });

    it('should return 404 for non-existent category', () => {
      const updateData = {
        name: 'Updated Name',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/categories/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      const updateData = {
        name: 'Updated Name',
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('/categories/:id (DELETE)', () => {
    let categoryId: string;

    beforeAll(async () => {
      const categoryData = {
        name: 'Delete Category Test',
        description: 'This category will be deleted',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryData);

      categoryId = response.body.id;
    });

    it('should delete a category successfully', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Category deleted successfully',
            categoryId: categoryId,
          });
        });
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/categories/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .expect(401);
    });
  });

  describe('Category-Task Integration', () => {
    let categoryId: string;
    let taskId: string;

    beforeAll(async () => {
      // Create a category for integration testing
      const categoryData = {
        name: 'Integration Test Category',
        description: 'Category for testing task integration',
        color: '#FF9900',
      };

      const categoryResponse = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryData);

      categoryId = categoryResponse.body.id;

      // Create a task with this category
      const taskData = {
        title: 'Integration Test Task',
        description: 'Task with category assignment',
        categoryId: categoryId,
      };

      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData);

      taskId = taskResponse.body.id;
    });

    it('should show category in task response', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.categoryId).toBe(categoryId);
          expect(res.body.category).toBeDefined();
          expect(res.body.category.name).toBe('Integration Test Category');
        });
    });

    it('should filter tasks by category', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.tasks.every((task: any) => task.categoryId === categoryId),
          ).toBe(true);
        });
    });

    it('should show tasks in category response', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tasks).toBeDefined();
          expect(res.body.tasks.some((task: any) => task.id === taskId)).toBe(
            true,
          );
        });
    });
  });

  describe('User Isolation', () => {
    let otherUserToken: string;

    beforeAll(async () => {
      // Create another user
      const otherUserData = {
        email: 'other-categories-test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'Other',
        lastName: 'User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(otherUserData);

      otherUserToken = registerResponse.body.accessToken;

      // Create a category for the other user
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'Other User Category',
          description: 'This belongs to another user',
        });
    });

    it('should not see other user categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.data.some(
              (cat: any) => cat.name === 'Other User Category',
            ),
          ).toBe(false);
        });
    });

    it('should not access other user category directly', () => {
      // First get the other user's category ID
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)
        .then((res) => {
          const otherUserCategory = res.body.data.find(
            (cat: any) => cat.name === 'Other User Category',
          );
          expect(otherUserCategory).toBeDefined();

          // Try to access it with first user's token
          return request(app.getHttpServer())
            .get(`/api/v1/categories/${otherUserCategory.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
        });
    });
  });
});
