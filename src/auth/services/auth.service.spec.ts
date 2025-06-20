import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockUsersService: any;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    isActive: true,
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(async () => {
    mockUsersService = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      validatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UsersService',
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue(mockToken),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
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
      mockUsersService.createUser.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(createUserDto);

      // Assert
      expect(mockUsersService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });

    it('should handle user service errors during registration', async () => {
      // Arrange
      mockUsersService.createUser.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.register(createUserDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully with valid credentials', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toEqual({
        accessToken: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });

  describe('validateJwtPayload', () => {
    it('should validate JWT payload and return user', async () => {
      // Arrange
      const payload = {
        sub: 'test-user-id',
        email: 'test@example.com',
      };
      mockUsersService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateJwtPayload(payload);

      // Assert
      expect(mockUsersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found during JWT validation', async () => {
      // Arrange
      const payload = {
        sub: 'non-existent-user',
        email: 'test@example.com',
      };
      mockUsersService.findById.mockResolvedValue(null);

      // Act
      const result = await service.validateJwtPayload(payload);

      // Assert
      expect(result).toBeNull();
    });
  });
});
