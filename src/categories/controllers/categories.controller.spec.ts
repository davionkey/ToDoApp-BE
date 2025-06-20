import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryQueryDto } from '../dto/category-query.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockCategory = {
    id: 'test-category-id',
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    userId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategoryList = {
    data: [mockCategory],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('test', () => {
    it('should return test message', async () => {
      // Act
      const result = await controller.test();

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Categories module is working',
        timestamp: expect.any(String),
      });
    });
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
      color: '#FF0000',
    };

    it('should create a category successfully', async () => {
      // Arrange
      mockCategoriesService.create.mockResolvedValue(mockCategory);

      // Act
      const result = await controller.create(createCategoryDto, mockUser.id);

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        createCategoryDto,
        mockUser.id,
      );
      expect(result).toEqual(mockCategory);
    });

    it('should handle ConflictException when category name exists', async () => {
      // Arrange
      const error = new ConflictException(
        'Category with this name already exists',
      );
      mockCategoriesService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.create(createCategoryDto, mockUser.id),
      ).rejects.toThrow(error);
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

    it('should return paginated categories', async () => {
      // Arrange
      mockCategoriesService.findAll.mockResolvedValue(mockCategoryList);

      // Act
      const result = await controller.findAll(queryDto, mockUser.id);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, queryDto);
      expect(result).toEqual(mockCategoryList);
    });

    it('should handle empty query parameters', async () => {
      // Arrange
      const emptyQuery: CategoryQueryDto = {};
      mockCategoriesService.findAll.mockResolvedValue(mockCategoryList);

      // Act
      const result = await controller.findAll(emptyQuery, mockUser.id);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, emptyQuery);
      expect(result).toEqual(mockCategoryList);
    });
  });

  describe('getStats', () => {
    const mockStats = {
      totalCategories: 5,
      categoriesWithTasks: 3,
      averageTasksPerCategory: 2.5,
    };

    it('should return category statistics', async () => {
      // Arrange
      mockCategoriesService.getStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStats(mockUser.id);

      // Assert
      expect(service.getStats).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockStats);
    });
  });

  describe('findOne', () => {
    it('should return a category when found', async () => {
      // Arrange
      mockCategoriesService.findOne.mockResolvedValue(mockCategory);

      // Act
      const result = await controller.findOne(mockCategory.id, mockUser.id);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(
        mockCategory.id,
        mockUser.id,
      );
      expect(result).toEqual(mockCategory);
    });

    it('should handle NotFoundException when category not found', async () => {
      // Arrange
      const error = new NotFoundException('Category not found');
      mockCategoriesService.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.findOne('non-existent-id', mockUser.id),
      ).rejects.toThrow(error);
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
      mockCategoriesService.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await controller.update(
        mockCategory.id,
        updateCategoryDto,
        mockUser.id,
      );

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockCategory.id,
        updateCategoryDto,
        mockUser.id,
      );
      expect(result).toEqual(updatedCategory);
    });

    it('should handle ConflictException when updating to existing name', async () => {
      // Arrange
      const error = new ConflictException(
        'Category with this name already exists',
      );
      mockCategoriesService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(mockCategory.id, updateCategoryDto, mockUser.id),
      ).rejects.toThrow(error);
    });

    it('should handle NotFoundException when category not found', async () => {
      // Arrange
      const error = new NotFoundException('Category not found');
      mockCategoriesService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('non-existent-id', updateCategoryDto, mockUser.id),
      ).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should remove a category successfully', async () => {
      // Arrange
      mockCategoriesService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(mockCategory.id, mockUser.id);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(mockCategory.id, mockUser.id);
      expect(result).toBeUndefined();
    });

    it('should handle NotFoundException when category not found', async () => {
      // Arrange
      const error = new NotFoundException('Category not found');
      mockCategoriesService.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.remove('non-existent-id', mockUser.id),
      ).rejects.toThrow(error);
    });
  });
});
