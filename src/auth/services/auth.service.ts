import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { JwtPayload, LoginResponse, UserResponse } from '../types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject('UsersService')
    private readonly usersService: any,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user
   */
  async register(createUserDto: CreateUserDto): Promise<LoginResponse> {
    const user = await this.usersService.createUser(createUserDto);
    const accessToken = await this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Authenticates user and returns JWT token
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT token
    const accessToken = await this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Validates JWT payload and returns user
   */
  async validateJwtPayload(payload: JwtPayload): Promise<UserResponse> {
    const user = await this.usersService.findById(payload.sub);
    return user;
  }

  /**
   * Generates JWT access token
   */
  private async generateToken(user: UserResponse): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload);
  }
}
