import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';
import {
  TaskResponse,
  TaskListResponse,
  TaskStatsResponse,
} from '../types/task.types';

@Injectable()
export class TasksService {
  private taskRepository?: Repository<Task>;

  constructor() {
    // Repository will be injected only if TypeORM is available
    try {
      // This will only work if TypeORM module is loaded
      if (process.env.SKIP_DB_CONNECTION !== 'true') {
        // Repository injection will be handled by the module
      }
    } catch (error) {
      // No repository available
    }
  }

  /**
   * Sets the repository (used by the module when TypeORM is available)
   */
  setRepository(repository: Repository<Task>): void {
    this.taskRepository = repository;
  }

  /**
   * Creates a new task for the authenticated user
   */
  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<TaskResponse> {
    if (!this.taskRepository) {
      throw new Error(
        'Database connection not available. Please set up database to use task features.',
      );
    }

    const taskData = {
      ...createTaskDto,
      userId,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
    };

    const task = this.taskRepository.create(taskData);
    const savedTask = await this.taskRepository.save(task);

    return this.transformTaskResponse(savedTask);
  }

  /**
   * Retrieves all tasks for the authenticated user with filtering and pagination
   */
  async findUserTasks(
    userId: string,
    queryDto: TaskQueryDto,
  ): Promise<TaskListResponse> {
    if (!this.taskRepository) {
      throw new Error('Database connection not available');
    }

    const { status, priority, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply pagination and ordering
    queryBuilder.orderBy('task.createdAt', 'DESC').skip(skip).take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      tasks: tasks.map((task) => this.transformTaskResponse(task)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves a single task by ID for the authenticated user
   */
  async findTaskById(id: string, userId: string): Promise<TaskResponse> {
    if (!this.taskRepository) {
      throw new NotFoundException('Database connection not available');
    }

    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.transformTaskResponse(task);
  }

  /**
   * Updates a task for the authenticated user
   */
  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponse> {
    if (!this.taskRepository) {
      throw new NotFoundException('Database connection not available');
    }

    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Update task data
    const updateData = {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : task.dueDate,
    };

    // Auto-update completion status based on status
    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      updateData.isCompleted = true;
    } else if (
      updateTaskDto.status === TaskStatus.PENDING ||
      updateTaskDto.status === TaskStatus.IN_PROGRESS
    ) {
      updateData.isCompleted = false;
    }

    await this.taskRepository.update(id, updateData);

    const updatedTask = await this.taskRepository.findOne({
      where: { id },
    });

    return this.transformTaskResponse(updatedTask!);
  }

  /**
   * Deletes a task for the authenticated user
   */
  async deleteTask(id: string, userId: string): Promise<void> {
    if (!this.taskRepository) {
      throw new NotFoundException('Database connection not available');
    }

    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.delete(id);
  }

  /**
   * Gets task statistics for the authenticated user
   */
  async getTaskStats(userId: string): Promise<TaskStatsResponse> {
    if (!this.taskRepository) {
      throw new Error('Database connection not available');
    }

    const [total, pending, inProgress, completed] = await Promise.all([
      this.taskRepository.count({ where: { userId } }),
      this.taskRepository.count({
        where: { userId, status: TaskStatus.PENDING },
      }),
      this.taskRepository.count({
        where: { userId, status: TaskStatus.IN_PROGRESS },
      }),
      this.taskRepository.count({
        where: { userId, status: TaskStatus.COMPLETED },
      }),
    ]);

    // Count overdue tasks
    const overdue = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate < :now', { now: new Date() })
      .andWhere('task.status != :completed', {
        completed: TaskStatus.COMPLETED,
      })
      .getCount();

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }

  /**
   * Transforms task entity to response format
   */
  private transformTaskResponse(task: Task): TaskResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      isCompleted: task.isCompleted,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
