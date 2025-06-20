import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from '../services/tasks.service';
import { TasksServiceMock } from '../services/tasks.service.mock';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useClass: TasksServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('test', () => {
    it('should return test message', async () => {
      const result = await controller.test();
      expect(result).toEqual({
        message: 'Tasks module is working',
        timestamp: expect.any(String),
        status: 'Phase 3: Task management implemented successfully',
      });
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.HIGH,
      };
      const mockUser = { id: 'test-user-id' } as any;

      const result = await controller.createTask(createTaskDto, mockUser);

      expect(result).toEqual({
        id: expect.any(String),
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dueDate: null,
        isCompleted: false,
        userId: 'test-user-id',
        categoryId: undefined,
        category: undefined,
        notes: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('getTasks', () => {
    it('should return paginated tasks', async () => {
      const queryDto = { page: 1, limit: 10 };
      const mockUser = { id: 'mock-user-id' } as any;

      const result = await controller.getTasks(queryDto, mockUser);

      expect(result).toEqual({
        tasks: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
      });
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      const mockUser = { id: 'mock-user-id' } as any;

      const result = await controller.getTaskStats(mockUser);

      expect(result).toEqual({
        total: expect.any(Number),
        pending: expect.any(Number),
        inProgress: expect.any(Number),
        completed: expect.any(Number),
        overdue: expect.any(Number),
      });
    });
  });
});
