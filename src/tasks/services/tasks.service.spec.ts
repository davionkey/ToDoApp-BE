import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createTask method', () => {
    expect(typeof service.createTask).toBe('function');
  });

  it('should have findUserTasks method', () => {
    expect(typeof service.findUserTasks).toBe('function');
  });

  it('should have findTaskById method', () => {
    expect(typeof service.findTaskById).toBe('function');
  });

  it('should have updateTask method', () => {
    expect(typeof service.updateTask).toBe('function');
  });

  it('should have deleteTask method', () => {
    expect(typeof service.deleteTask).toBe('function');
  });

  it('should have getTaskStats method', () => {
    expect(typeof service.getTaskStats).toBe('function');
  });

  it('should have bulkUpdateTasks method', () => {
    expect(typeof service.bulkUpdateTasks).toBe('function');
  });

  it('should have bulkDeleteTasks method', () => {
    expect(typeof service.bulkDeleteTasks).toBe('function');
  });

  it('should have addTaskNote method', () => {
    expect(typeof service.addTaskNote).toBe('function');
  });

  it('should have removeTaskNote method', () => {
    expect(typeof service.removeTaskNote).toBe('function');
  });
});
