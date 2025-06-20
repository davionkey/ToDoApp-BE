import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateJwtPayload: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    accessToken: 'mock-jwt-token',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
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
        message: 'Auth module is working',
        timestamp: expect.any(String),
        status: 'Phase 2: Authentication implemented successfully',
      });
    });
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      mockAuthService.register.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.register(createUserDto);

      // Assert
      expect(service.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle registration errors', async () => {
      // Arrange
      const error = new Error('Email already exists');
      mockAuthService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(createUserDto)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully with valid credentials', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle login errors', async () => {
      // Arrange
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      // Arrange
      const mockRequest = { user: mockUser };

      // Act
      const result = await controller.getProfile(mockRequest.user);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });
});
