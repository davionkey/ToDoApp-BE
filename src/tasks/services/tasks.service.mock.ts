import { Injectable } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';
import {
  TaskResponse,
  TaskListResponse,
  TaskStatsResponse,
} from '../types/task.types';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

@Injectable()
export class MockTasksService extends TasksService {
  private mockTasks: TaskResponse[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Sample Task 1',
      description: 'This is a sample task for demonstration',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2024-12-31'),
      isCompleted: false,
      userId: 'mock-user-id',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Sample Task 2',
      description: 'Another sample task',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: undefined,
      isCompleted: false,
      userId: 'mock-user-id',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Completed Task',
      description: 'This task is already completed',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      dueDate: new Date('2024-01-15'),
      isCompleted: true,
      userId: 'mock-user-id',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  /**
   * Mock implementation of createTask
   */
  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<TaskResponse> {
    const newTask: TaskResponse = {
      id: `mock-task-${Date.now()}`,
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.PENDING,
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
      isCompleted: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockTasks.push(newTask);
    return newTask;
  }

  /**
   * Mock implementation of findUserTasks
   */
  async findUserTasks(
    userId: string,
    queryDto: TaskQueryDto,
  ): Promise<TaskListResponse> {
    let filteredTasks = this.mockTasks.filter((task) => task.userId === userId);

    // Apply filters
    if (queryDto.status) {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === queryDto.status,
      );
    }

    if (queryDto.priority) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === queryDto.priority,
      );
    }

    if (queryDto.search) {
      const searchLower = queryDto.search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower)),
      );
    }

    // Apply pagination
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;
    const paginatedTasks = filteredTasks.slice(skip, skip + limit);

    return {
      tasks: paginatedTasks,
      total: filteredTasks.length,
      page,
      limit,
      totalPages: Math.ceil(filteredTasks.length / limit),
    };
  }

  /**
   * Mock implementation of findTaskById
   */
  async findTaskById(id: string, userId: string): Promise<TaskResponse> {
    const task = this.mockTasks.find(
      (task) => task.id === id && task.userId === userId,
    );

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  /**
   * Mock implementation of updateTask
   */
  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponse> {
    const taskIndex = this.mockTasks.findIndex(
      (task) => task.id === id && task.userId === userId,
    );

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...this.mockTasks[taskIndex],
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : this.mockTasks[taskIndex].dueDate,
      updatedAt: new Date(),
    };

    // Auto-update completion status
    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      updatedTask.isCompleted = true;
    } else if (
      updateTaskDto.status === TaskStatus.PENDING ||
      updateTaskDto.status === TaskStatus.IN_PROGRESS
    ) {
      updatedTask.isCompleted = false;
    }

    this.mockTasks[taskIndex] = updatedTask;
    return updatedTask;
  }

  /**
   * Mock implementation of deleteTask
   */
  async deleteTask(id: string, userId: string): Promise<void> {
    const taskIndex = this.mockTasks.findIndex(
      (task) => task.id === id && task.userId === userId,
    );

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    this.mockTasks.splice(taskIndex, 1);
  }

  /**
   * Mock implementation of getTaskStats
   */
  async getTaskStats(userId: string): Promise<TaskStatsResponse> {
    const userTasks = this.mockTasks.filter((task) => task.userId === userId);
    const now = new Date();

    return {
      total: userTasks.length,
      pending: userTasks.filter((task) => task.status === TaskStatus.PENDING)
        .length,
      inProgress: userTasks.filter(
        (task) => task.status === TaskStatus.IN_PROGRESS,
      ).length,
      completed: userTasks.filter(
        (task) => task.status === TaskStatus.COMPLETED,
      ).length,
      overdue: userTasks.filter(
        (task) =>
          task.dueDate &&
          task.dueDate < now &&
          task.status !== TaskStatus.COMPLETED,
      ).length,
    };
  }
}
