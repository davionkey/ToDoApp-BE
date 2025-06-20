import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository, Like, In } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';
import {
  BulkUpdateTasksDto,
  BulkDeleteTasksDto,
} from '../dto/bulk-update-tasks.dto';
import { AddTaskNoteDto } from '../dto/task-notes.dto';
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

    const {
      status,
      priority,
      search,
      page = 1,
      limit = 10,
      categoryId,
    } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .where('task.userId = :userId', { userId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (categoryId) {
      queryBuilder.andWhere('task.categoryId = :categoryId', { categoryId });
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
      relations: ['category'],
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
   * Bulk update multiple tasks
   */
  async bulkUpdateTasks(
    bulkUpdateDto: BulkUpdateTasksDto,
    userId: string,
  ): Promise<{ updated: number; failed: string[] }> {
    if (!this.taskRepository) {
      throw new Error('Database connection not available');
    }

    const { taskIds, ...updateData } = bulkUpdateDto;
    const failed: string[] = [];
    let updated = 0;

    // Verify all tasks belong to the user
    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds), userId },
    });

    const validTaskIds = tasks.map((task) => task.id);
    const invalidTaskIds = taskIds.filter((id) => !validTaskIds.includes(id));
    failed.push(...invalidTaskIds);

    if (validTaskIds.length > 0) {
      const updatePayload: any = { ...updateData };

      // Auto-update completion status based on status
      if (updateData.status === TaskStatus.COMPLETED) {
        updatePayload.isCompleted = true;
      } else if (
        updateData.status === TaskStatus.PENDING ||
        updateData.status === TaskStatus.IN_PROGRESS
      ) {
        updatePayload.isCompleted = false;
      }

      await this.taskRepository.update({ id: In(validTaskIds) }, updatePayload);
      updated = validTaskIds.length;
    }

    return { updated, failed };
  }

  /**
   * Bulk delete multiple tasks
   */
  async bulkDeleteTasks(
    bulkDeleteDto: BulkDeleteTasksDto,
    userId: string,
  ): Promise<{ deleted: number; failed: string[] }> {
    if (!this.taskRepository) {
      throw new Error('Database connection not available');
    }

    const { taskIds } = bulkDeleteDto;
    const failed: string[] = [];

    // Verify all tasks belong to the user
    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds), userId },
    });

    const validTaskIds = tasks.map((task) => task.id);
    const invalidTaskIds = taskIds.filter((id) => !validTaskIds.includes(id));
    failed.push(...invalidTaskIds);

    let deleted = 0;
    if (validTaskIds.length > 0) {
      await this.taskRepository.delete({ id: In(validTaskIds) });
      deleted = validTaskIds.length;
    }

    return { deleted, failed };
  }

  /**
   * Add a note to a task
   */
  async addTaskNote(
    taskId: string,
    addNoteDto: AddTaskNoteDto,
    userId: string,
  ): Promise<TaskResponse> {
    if (!this.taskRepository) {
      throw new Error('Database connection not available');
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: addNoteDto.content,
      createdAt: new Date(),
    };

    const updatedNotes = [...(task.notes || []), newNote];
    await this.taskRepository.update(taskId, { notes: updatedNotes });

    const updatedTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['category'],
    });

    return this.transformTaskResponse(updatedTask!);
  }

  /**
   * Remove a note from a task
   */
  async removeTaskNote(
    taskId: string,
    noteId: string,
    userId: string,
  ): Promise<TaskResponse> {
    if (!this.taskRepository) {
      throw new Error('Database connection not available');
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updatedNotes = (task.notes || []).filter(
      (note) => note.id !== noteId,
    );
    await this.taskRepository.update(taskId, { notes: updatedNotes });

    const updatedTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['category'],
    });

    return this.transformTaskResponse(updatedTask!);
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
      categoryId: task.categoryId,
      category: task.category,
      notes: task.notes || [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
