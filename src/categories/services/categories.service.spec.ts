import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryQueryDto } from '../dto/category-query.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const mockUserId = 'test-user-id';
  const mockCategory: Category = {
    id: 'test-category-id',
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    userId: mockUserId,
    user: { id: mockUserId } as any,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    where: jest.fn(() => mockQueryBuilder),
    andWhere: jest.fn(() => mockQueryBuilder),
    leftJoinAndSelect: jest.fn(() => mockQueryBuilder),
    addSelect: jest.fn(() => mockQueryBuilder),
    groupBy: jest.fn(() => mockQueryBuilder),
    addGroupBy: jest.fn(() => mockQueryBuilder),
    orderBy: jest.fn(() => mockQueryBuilder),
    skip: jest.fn(() => mockQueryBuilder),
    take: jest.fn(() => mockQueryBuilder),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
      color: '#FF0000',
    };

    it('should create a category successfully', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockCategory);
      jest.spyOn(repository, 'save').mockResolvedValue(mockCategory);

      // Act
      const result = await service.create(createCategoryDto, mockUserId);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name, userId: mockUserId },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createCategoryDto,
        userId: mockUserId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException when category name already exists', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCategory);

      // Act & Assert
      await expect(
        service.create(createCategoryDto, mockUserId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create(createCategoryDto, mockUserId),
      ).rejects.toThrow('Category with this name already exists');
    });
  });

  describe('findAll', () => {
    const queryDto: CategoryQueryDto = {
      search: 'test',
      page: '1',
      limit: '10',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    it('should return paginated categories with search', async () => {
      // Arrange
      const expectedCategories = [mockCategory];
      const expectedTotal = 1;

      mockQueryBuilder.getMany.mockResolvedValue(expectedCategories);
      mockQueryBuilder.getCount.mockResolvedValue(expectedTotal);

      // Act
      const result = await service.findAll(mockUserId, queryDto);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'category.userId = :userId',
        { userId: mockUserId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.name ILIKE :search',
        { search: '%test%' },
      );
      expect(result).toEqual({
        data: expectedCategories,
        meta: {
          total: expectedTotal,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return categories without search filter', async () => {
      // Arrange
      const queryDtoWithoutSearch: CategoryQueryDto = {
        page: '1',
        limit: '10',
      };
      const expectedCategories = [mockCategory];
      const expectedTotal = 1;

      mockQueryBuilder.getMany.mockResolvedValue(expectedCategories);
      mockQueryBuilder.getCount.mockResolvedValue(expectedTotal);

      // Act
      const result = await service.findAll(mockUserId, queryDtoWithoutSearch);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'category.userId = :userId',
        { userId: mockUserId },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result.data).toEqual(expectedCategories);
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const queryDtoPage2: CategoryQueryDto = {
        page: '2',
        limit: '5',
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(7);

      // Act
      const result = await service.findAll(mockUserId, queryDtoPage2);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.meta).toEqual({
        total: 7,
        page: 2,
        limit: 5,
        totalPages: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should return a category when found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCategory);

      // Act
      const result = await service.findOne(mockCategory.id, mockUserId);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId: mockUserId },
        relations: ['tasks'],
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('non-existent-id', mockUserId),
      ).rejects.toThrow('Category not found');
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateCategoryDto = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('should update a category successfully', async () => {
      // Arrange
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedCategory);

      // Act
      const result = await service.update(
        mockCategory.id,
        updateCategoryDto,
        mockUserId,
      );

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockCategory.id, mockUserId);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: updateCategoryDto.name, userId: mockUserId },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedCategory);
    });

    it('should update category without name change', async () => {
      // Arrange
      const updateDtoWithoutName: UpdateCategoryDto = {
        description: 'Updated Description Only',
      };
      const updatedCategory = { ...mockCategory, ...updateDtoWithoutName };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedCategory);

      // Act
      const result = await service.update(
        mockCategory.id,
        updateDtoWithoutName,
        mockUserId,
      );

      // Assert
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('remove', () => {
    it('should remove a category successfully', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockCategory);

      // Act
      await service.remove(mockCategory.id, mockUserId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockCategory.id, mockUserId);
      expect(repository.remove).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('getStats', () => {
    it('should return category statistics', async () => {
      // Arrange
      const categoriesWithTasks = [
        {
          ...mockCategory,
          tasks: [
            {
              id: 'task1',
              title: 'Task 1',
              status: 'PENDING',
              priority: 'MEDIUM',
              isCompleted: false,
            } as any,
            {
              id: 'task2',
              title: 'Task 2',
              status: 'PENDING',
              priority: 'MEDIUM',
              isCompleted: false,
            } as any,
          ],
        },
        {
          ...mockCategory,
          id: 'cat2',
          tasks: [
            {
              id: 'task3',
              title: 'Task 3',
              status: 'PENDING',
              priority: 'MEDIUM',
              isCompleted: false,
            } as any,
          ],
        },
        { ...mockCategory, id: 'cat3', tasks: [] },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(categoriesWithTasks);

      // Act
      const result = await service.getStats(mockUserId);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        relations: ['tasks'],
      });
      expect(result).toEqual({
        totalCategories: 3,
        categoriesWithTasks: 2,
        averageTasksPerCategory: 1,
      });
    });

    it('should handle empty categories', async () => {
      // Arrange
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.getStats(mockUserId);

      // Assert
      expect(result).toEqual({
        totalCategories: 0,
        categoriesWithTasks: 0,
        averageTasksPerCategory: 0,
      });
    });
  });
});
