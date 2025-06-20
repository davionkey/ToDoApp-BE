import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryQueryDto } from '../dto/category-query.dto';

export interface CategoryListResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    // Check if category name already exists for this user
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, userId },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });

    return this.categoryRepository.save(category);
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

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.userId = :userId', { userId })
      .leftJoinAndSelect('category.tasks', 'tasks')
      .addSelect('COUNT(tasks.id)', 'taskCount')
      .groupBy('category.id')
      .addGroupBy('tasks.id');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere('category.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`category.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // Get total count for pagination
    const totalQueryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.userId = :userId', { userId });

    if (search) {
      totalQueryBuilder.andWhere('category.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [categories, total] = await Promise.all([
      queryBuilder.skip(offset).take(limitNum).getMany(),
      totalQueryBuilder.getCount(),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['tasks'],
    });

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
    const category = await this.findOne(id, userId);

    // Check if name is being updated and already exists
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name, userId },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.remove(category);
  }

  async getStats(userId: string): Promise<{
    totalCategories: number;
    categoriesWithTasks: number;
    averageTasksPerCategory: number;
  }> {
    const categories = await this.categoryRepository.find({
      where: { userId },
      relations: ['tasks'],
    });

    const totalCategories = categories.length;
    const categoriesWithTasks = categories.filter(
      (cat) => cat.tasks && cat.tasks.length > 0,
    ).length;
    const totalTasks = categories.reduce(
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
