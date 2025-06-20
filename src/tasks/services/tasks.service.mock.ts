import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
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
export class TasksServiceMock {
  private mockTasks: TaskResponse[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the API',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-12-31'),
      isCompleted: false,
      userId: 'user-1',
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
      category: undefined,
      notes: [
        {
          id: 'note-1',
          content: 'Started working on API documentation',
          createdAt: new Date('2024-01-01'),
        },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Review code changes',
      description: 'Review pull request #123',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2024-12-25'),
      isCompleted: false,
      userId: 'user-1',
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
      category: undefined,
      notes: [],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Set up deployment pipeline',
      description: 'Configure CI/CD for the project',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      dueDate: null,
      isCompleted: true,
      userId: 'user-1',
      categoryId: undefined,
      category: undefined,
      notes: [],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-10'),
    },
  ];

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<TaskResponse> {
    const newTask: TaskResponse = {
      id: `550e8400-e29b-41d4-a716-${Date.now()}`,
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.PENDING,
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      isCompleted: false,
      userId,
      categoryId: createTaskDto.categoryId,
      category: undefined,
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockTasks.push(newTask);
    return newTask;
  }

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

    if (queryDto.categoryId) {
      filteredTasks = filteredTasks.filter(
        (task) => task.categoryId === queryDto.categoryId,
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
    const total = filteredTasks.length;
    const skip = (page - 1) * limit;

    const paginatedTasks = filteredTasks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + limit);

    return {
      tasks: paginatedTasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTaskById(id: string, userId: string): Promise<TaskResponse> {
    const task = this.mockTasks.find((t) => t.id === id && t.userId === userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponse> {
    const taskIndex = this.mockTasks.findIndex(
      (t) => t.id === id && t.userId === userId,
    );

    if (taskIndex === -1) {
      throw new NotFoundException('Task not found');
    }

    const task = this.mockTasks[taskIndex];

    // Update task
    this.mockTasks[taskIndex] = {
      ...task,
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : task.dueDate,
      isCompleted:
        updateTaskDto.status === TaskStatus.COMPLETED
          ? true
          : updateTaskDto.status === TaskStatus.PENDING ||
              updateTaskDto.status === TaskStatus.IN_PROGRESS
            ? false
            : task.isCompleted,
      updatedAt: new Date(),
    };

    return this.mockTasks[taskIndex];
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const taskIndex = this.mockTasks.findIndex(
      (t) => t.id === id && t.userId === userId,
    );

    if (taskIndex === -1) {
      throw new NotFoundException('Task not found');
    }

    this.mockTasks.splice(taskIndex, 1);
  }

  async getTaskStats(userId: string): Promise<TaskStatsResponse> {
    const userTasks = this.mockTasks.filter((task) => task.userId === userId);

    const total = userTasks.length;
    const pending = userTasks.filter(
      (t) => t.status === TaskStatus.PENDING,
    ).length;
    const inProgress = userTasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const completed = userTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;

    // Count overdue tasks
    const now = new Date();
    const overdue = userTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== TaskStatus.COMPLETED,
    ).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }

  async bulkUpdateTasks(
    bulkUpdateDto: BulkUpdateTasksDto,
    userId: string,
  ): Promise<{ updated: number; failed: string[] }> {
    const { taskIds, ...updateData } = bulkUpdateDto;
    const failed: string[] = [];
    let updated = 0;

    for (const taskId of taskIds) {
      const taskIndex = this.mockTasks.findIndex(
        (t) => t.id === taskId && t.userId === userId,
      );

      if (taskIndex === -1) {
        failed.push(taskId);
        continue;
      }

      const task = this.mockTasks[taskIndex];
      this.mockTasks[taskIndex] = {
        ...task,
        ...updateData,
        isCompleted:
          updateData.status === TaskStatus.COMPLETED
            ? true
            : updateData.status === TaskStatus.PENDING ||
                updateData.status === TaskStatus.IN_PROGRESS
              ? false
              : task.isCompleted,
        updatedAt: new Date(),
      };
      updated++;
    }

    return { updated, failed };
  }

  async bulkDeleteTasks(
    bulkDeleteDto: BulkDeleteTasksDto,
    userId: string,
  ): Promise<{ deleted: number; failed: string[] }> {
    const { taskIds } = bulkDeleteDto;
    const failed: string[] = [];
    let deleted = 0;

    for (const taskId of taskIds) {
      const taskIndex = this.mockTasks.findIndex(
        (t) => t.id === taskId && t.userId === userId,
      );

      if (taskIndex === -1) {
        failed.push(taskId);
        continue;
      }

      this.mockTasks.splice(taskIndex, 1);
      deleted++;
    }

    return { deleted, failed };
  }

  async addTaskNote(
    taskId: string,
    addNoteDto: AddTaskNoteDto,
    userId: string,
  ): Promise<TaskResponse> {
    const taskIndex = this.mockTasks.findIndex(
      (t) => t.id === taskId && t.userId === userId,
    );

    if (taskIndex === -1) {
      throw new NotFoundException('Task not found');
    }

    const task = this.mockTasks[taskIndex];
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: addNoteDto.content,
      createdAt: new Date(),
    };

    this.mockTasks[taskIndex] = {
      ...task,
      notes: [...task.notes, newNote],
      updatedAt: new Date(),
    };

    return this.mockTasks[taskIndex];
  }

  async removeTaskNote(
    taskId: string,
    noteId: string,
    userId: string,
  ): Promise<TaskResponse> {
    const taskIndex = this.mockTasks.findIndex(
      (t) => t.id === taskId && t.userId === userId,
    );

    if (taskIndex === -1) {
      throw new NotFoundException('Task not found');
    }

    const task = this.mockTasks[taskIndex];
    const updatedNotes = task.notes.filter((note) => note.id !== noteId);

    this.mockTasks[taskIndex] = {
      ...task,
      notes: updatedNotes,
      updatedAt: new Date(),
    };

    return this.mockTasks[taskIndex];
  }
}
