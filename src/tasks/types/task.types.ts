import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { Category } from '../../categories/entities/category.entity';

export interface TaskNote {
  id: string;
  content: string;
  createdAt: Date;
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  isCompleted: boolean;
  userId: string;
  categoryId?: string;
  category?: Category;
  notes: TaskNote[];
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
