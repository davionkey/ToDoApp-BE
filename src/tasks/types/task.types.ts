import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  isCompleted: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskListResponse {
  tasks: TaskResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskStatsResponse {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}
