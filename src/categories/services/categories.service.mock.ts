import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryQueryDto } from '../dto/category-query.dto';
import { CategoryListResponse } from './categories.service';

@Injectable()
export class CategoriesServiceMock {
  private categories: Category[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Work',
      description: 'Work-related tasks and projects',
      color: '#EF4444',
      userId: 'user-1',
      user: undefined as any,
      tasks: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Personal',
      description: 'Personal tasks and activities',
      color: '#10B981',
      userId: 'user-1',
      user: undefined as any,
      tasks: [],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Health',
      description: 'Health and fitness related tasks',
      color: '#8B5CF6',
      userId: 'user-1',
      user: undefined as any,
      tasks: [],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    // Check if category name already exists for this user
    const existingCategory = this.categories.find(
      (cat) =>
        cat.name.toLowerCase() === createCategoryDto.name.toLowerCase() &&
        cat.userId === userId,
    );

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const newCategory: Category = {
      id: `550e8400-e29b-41d4-a716-${Date.now()}`,
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      color: createCategoryDto.color || '#6366F1',
      userId,
      user: undefined as any,
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  async findAll(
    userId: string,
    query: CategoryQueryDto,
  ): Promise<CategoryListResponse> {
    const {
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    let filteredCategories = this.categories.filter(
      (cat) => cat.userId === userId,
    );

    // Apply search filter
    if (search) {
      filteredCategories = filteredCategories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply sorting
    filteredCategories.sort((a, b) => {
      const aValue = a[sortBy as keyof Category] as any;
      const bValue = b[sortBy as keyof Category] as any;

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const total = filteredCategories.length;
    const offset = (pageNum - 1) * limitNum;

    const paginatedCategories = filteredCategories.slice(
      offset,
      offset + limitNum,
    );

    return {
      data: paginatedCategories,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = this.categories.find(
      (cat) => cat.id === id && cat.userId === userId,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const categoryIndex = this.categories.findIndex(
      (cat) => cat.id === id && cat.userId === userId,
    );

    if (categoryIndex === -1) {
      throw new NotFoundException('Category not found');
    }

    // Check if name is being updated and already exists
    if (updateCategoryDto.name) {
      const existingCategory = this.categories.find(
        (cat) =>
          cat.name.toLowerCase() === updateCategoryDto.name!.toLowerCase() &&
          cat.userId === userId &&
          cat.id !== id,
      );

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updatedCategory = {
      ...this.categories[categoryIndex],
      ...updateCategoryDto,
      updatedAt: new Date(),
    };

    this.categories[categoryIndex] = updatedCategory;
    return updatedCategory;
  }

  async remove(id: string, userId: string): Promise<void> {
    const categoryIndex = this.categories.findIndex(
      (cat) => cat.id === id && cat.userId === userId,
    );

    if (categoryIndex === -1) {
      throw new NotFoundException('Category not found');
    }

    this.categories.splice(categoryIndex, 1);
  }

  async getStats(userId: string): Promise<{
    totalCategories: number;
    categoriesWithTasks: number;
    averageTasksPerCategory: number;
  }> {
    const userCategories = this.categories.filter(
      (cat) => cat.userId === userId,
    );
    const totalCategories = userCategories.length;
    const categoriesWithTasks = userCategories.filter(
      (cat) => cat.tasks && cat.tasks.length > 0,
    ).length;
    const totalTasks = userCategories.reduce(
      (sum, cat) => sum + (cat.tasks?.length || 0),
      0,
    );
    const averageTasksPerCategory =
      totalCategories > 0 ? totalTasks / totalCategories : 0;

    return {
      totalCategories,
      categoriesWithTasks,
      averageTasksPerCategory: Math.round(averageTasksPerCategory * 100) / 100,
    };
  }
}
