import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponse } from '../../auth/types/auth.types';

@Injectable()
export class UsersService {
  private userRepository?: Repository<User>;

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
  setRepository(repository: Repository<User>): void {
    this.userRepository = repository;
  }

  /**
   * Creates a new user with hashed password
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponse> {
    if (!this.userRepository) {
      throw new Error(
        'Database connection not available. Please set up database to use authentication features.',
      );
    }

    const { email, password, firstName, lastName } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create and save user
    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Return user without password
    return this.transformUserResponse(savedUser);
  }

  /**
   * Finds user by email for authentication
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!this.userRepository) {
      return null;
    }
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Finds user by ID
   */
  async findById(id: string): Promise<UserResponse> {
    if (!this.userRepository) {
      throw new NotFoundException('Database connection not available');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformUserResponse(user);
  }

  /**
   * Validates password against hash
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Transforms user entity to response format (excludes password)
   */
  private transformUserResponse(user: User): UserResponse {
    const { password, ...userResponse } = user;
    return userResponse;
  }
}
