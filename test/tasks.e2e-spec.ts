import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TaskStatus, TaskPriority } from '../src/tasks/entities/task.entity';

describe('Tasks (e2e)', () => {
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
      email: 'tasks-test@example.com',
      password: 'StrongP@ssw0rd123',
      firstName: 'Tasks',
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

  describe('/tasks/test (GET)', () => {
    it('should return tasks module status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Tasks module is working',
            timestamp: expect.any(String),
            status: 'Phase 3: Task management implemented successfully',
          });
        });
    });
  });

  describe('/tasks (POST)', () => {
    it('should create a task successfully', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      };

      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            title: taskData.title,
            description: taskData.description,
            status: TaskStatus.PENDING,
            priority: taskData.priority,
            dueDate: taskData.dueDate,
            isCompleted: false,
            userId: userId,
            categoryId: null,
            category: null,
            notes: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('should create a minimal task with only title', () => {
      const minimalTaskData = {
        title: 'Minimal Task',
      };

      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(minimalTaskData)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe(minimalTaskData.title);
          expect(res.body.status).toBe(TaskStatus.PENDING);
          expect(res.body.priority).toBe(TaskPriority.MEDIUM);
          expect(res.body.isCompleted).toBe(false);
        });
    });

    it('should return 400 for missing title', () => {
      const invalidTaskData = {
        description: 'Task without title',
      };

      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidTaskData)
        .expect(400);
    });

    it('should return 401 without authentication', () => {
      const taskData = {
        title: 'Unauthorized Task',
      };

      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(401);
    });
  });

  describe('/tasks (GET)', () => {
    let createdTaskIds: string[] = [];

    beforeAll(async () => {
      // Create multiple tasks for testing
      const tasks = [
        {
          title: 'Task 1',
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
        },
        {
          title: 'Task 2',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.IN_PROGRESS,
        },
        {
          title: 'Task 3',
          priority: TaskPriority.LOW,
          status: TaskStatus.COMPLETED,
        },
        {
          title: 'Important Task',
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
        },
      ];

      for (const task of tasks) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(task);
        createdTaskIds.push(response.body.id);
      }
    });

    it('should return paginated tasks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            tasks: expect.any(Array),
            total: expect.any(Number),
            page: 1,
            limit: 10,
            totalPages: expect.any(Number),
          });
          expect(res.body.tasks.length).toBeGreaterThan(0);
        });
    });

    it('should filter tasks by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?status=PENDING')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.tasks.every(
              (task: any) => task.status === TaskStatus.PENDING,
            ),
          ).toBe(true);
        });
    });

    it('should filter tasks by priority', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.tasks.every(
              (task: any) => task.priority === TaskPriority.HIGH,
            ),
          ).toBe(true);
        });
    });

    it('should search tasks by title', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?search=Important')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.tasks.some((task: any) =>
              task.title.includes('Important'),
            ),
          ).toBe(true);
        });
    });

    it('should handle pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tasks.length).toBeLessThanOrEqual(2);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(2);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/tasks').expect(401);
    });
  });

  describe('/tasks/stats (GET)', () => {
    it('should return task statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            total: expect.any(Number),
            pending: expect.any(Number),
            inProgress: expect.any(Number),
            completed: expect.any(Number),
            overdue: expect.any(Number),
          });
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/stats')
        .expect(401);
    });
  });

  describe('/tasks/:id (GET)', () => {
    let taskId: string;

    beforeAll(async () => {
      const taskData = {
        title: 'Single Task Test',
        description: 'Test Description',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData);

      taskId = response.body.id;
    });

    it('should return a specific task', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(taskId);
          expect(res.body.title).toBe('Single Task Test');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('/tasks/:id (PUT)', () => {
    let taskId: string;

    beforeAll(async () => {
      const taskData = {
        title: 'Update Task Test',
        status: TaskStatus.PENDING,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData);

      taskId = response.body.id;
    });

    it('should update a task successfully', () => {
      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
      };

      return request(app.getHttpServer())
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updateData.title);
          expect(res.body.status).toBe(updateData.status);
          expect(res.body.priority).toBe(updateData.priority);
          expect(res.body.isCompleted).toBe(true); // auto-completed
        });
    });

    it('should return 404 for non-existent task', () => {
      const updateData = {
        title: 'Updated Title',
      };

      return request(app.getHttpServer())
        .put('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      const updateData = {
        title: 'Updated Title',
      };

      return request(app.getHttpServer())
        .put(`/api/v1/tasks/${taskId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    let taskId: string;

    beforeAll(async () => {
      const taskData = {
        title: 'Delete Task Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData);

      taskId = response.body.id;
    });

    it('should delete a task successfully', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Task deleted successfully',
            taskId: taskId,
          });
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('Bulk Operations', () => {
    let bulkTaskIds: string[] = [];

    beforeAll(async () => {
      // Create tasks for bulk operations
      const tasks = [
        { title: 'Bulk Task 1' },
        { title: 'Bulk Task 2' },
        { title: 'Bulk Task 3' },
      ];

      for (const task of tasks) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(task);
        bulkTaskIds.push(response.body.id);
      }
    });

    describe('/tasks/bulk/update (PUT)', () => {
      it('should bulk update tasks successfully', () => {
        const bulkUpdateData = {
          taskIds: bulkTaskIds.slice(0, 2),
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
        };

        return request(app.getHttpServer())
          .put('/api/v1/tasks/bulk/update')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(bulkUpdateData)
          .expect(200)
          .expect((res) => {
            expect(res.body.updatedCount).toBe(2);
            expect(res.body.failedUpdates).toHaveLength(0);
          });
      });

      it('should return 401 without authentication', () => {
        const bulkUpdateData = {
          taskIds: bulkTaskIds,
          status: TaskStatus.COMPLETED,
        };

        return request(app.getHttpServer())
          .put('/api/v1/tasks/bulk/update')
          .send(bulkUpdateData)
          .expect(401);
      });
    });

    describe('/tasks/bulk/delete (DELETE)', () => {
      it('should bulk delete tasks successfully', () => {
        const bulkDeleteData = {
          taskIds: [bulkTaskIds[2]], // delete one remaining task
        };

        return request(app.getHttpServer())
          .delete('/api/v1/tasks/bulk/delete')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(bulkDeleteData)
          .expect(200)
          .expect((res) => {
            expect(res.body.deletedCount).toBe(1);
            expect(res.body.failedDeletes).toHaveLength(0);
          });
      });

      it('should return 401 without authentication', () => {
        const bulkDeleteData = {
          taskIds: ['some-id'],
        };

        return request(app.getHttpServer())
          .delete('/api/v1/tasks/bulk/delete')
          .send(bulkDeleteData)
          .expect(401);
      });
    });
  });

  describe('Task Notes', () => {
    let taskId: string;

    beforeAll(async () => {
      const taskData = {
        title: 'Notes Task Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData);

      taskId = response.body.id;
    });

    describe('/tasks/:id/notes (POST)', () => {
      it('should add note to task successfully', () => {
        const noteData = {
          note: 'This is a test note',
        };

        return request(app.getHttpServer())
          .post(`/api/v1/tasks/${taskId}/notes`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(noteData)
          .expect(201)
          .expect((res) => {
            expect(res.body.notes).toHaveLength(1);
            expect(res.body.notes[0].note).toBe(noteData.note);
            expect(res.body.notes[0].id).toBeDefined();
          });
      });

      it('should return 404 for non-existent task', () => {
        const noteData = {
          note: 'Note for non-existent task',
        };

        return request(app.getHttpServer())
          .post('/api/v1/tasks/non-existent-id/notes')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(noteData)
          .expect(404);
      });
    });

    describe('/tasks/:id/notes/:noteId (DELETE)', () => {
      let noteId: string;

      beforeAll(async () => {
        const noteData = {
          note: 'Note to be deleted',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/v1/tasks/${taskId}/notes`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(noteData);

        noteId = response.body.notes[response.body.notes.length - 1].id;
      });

      it('should remove note from task successfully', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/tasks/${taskId}/notes/${noteId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(
              res.body.notes.find((n: any) => n.id === noteId),
            ).toBeUndefined();
          });
      });

      it('should return 404 for non-existent note', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/tasks/${taskId}/notes/non-existent-note`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });
  });
});
