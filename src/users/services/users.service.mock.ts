import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponse } from '../../auth/types/auth.types';

@Injectable()
export class MockUsersService {
  /**
   * Creates a new user (mock implementation)
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponse> {
    throw new Error(
      'Authentication features require database connection. Please set up PostgreSQL database.',
    );
  }

  /**
   * Finds user by email (mock implementation)
   */
  async findByEmail(email: string): Promise<any> {
    return null;
  }

  /**
   * Finds user by ID (mock implementation)
   */
  async findById(id: string): Promise<UserResponse> {
    throw new NotFoundException('Database connection not available');
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
}
