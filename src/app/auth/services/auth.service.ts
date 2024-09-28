import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Fetches all users.
   * @returns Array of users.
   */
  async findAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Creates a new user.
   * @param data - Data for creating a user.
   * @returns The created user.
   */
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const { password, ...rest } = data;

    if (!password) {
      throw new Error('Password is required');
    }

    const hashedPassword = await argon2.hash(password);
    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      },
    });
  }

  /**
   * Logs in a user.
   * @param email - User email.
   * @param password - User password.
   * @returns The logged in user.
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await argon2.verify(user.password, password))) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  /**
   * Logs in a user and generates a JWT token.
   * @param email - User email.
   * @param password - User password.
   * @returns Object containing accessToken and user data.
   * @throws UnauthorizedException if login fails.
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: UserEntity }> {
    const user = await this.validateUser(email, password);

    const payload = { sub: user.id, email: user.email };

    try {
      const accessToken = this.jwtService.sign(payload);
      return { accessToken, user };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * Setup Biometric Key.
   * @param email - User email.
   * @param biometricKey - User biometric data.
   * @returns Object containing accessToken and user data.
   * @throws UnauthorizedException if login fails.
   */
  async setupBiometricKey(
    email: string,
    biometricKey: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        biometricKey,
      },
    }) as unknown as UserEntity;
  }

  /**
   * Biometric Login.
   * @param email - User email.
   * @param biometricKey - User biometric data.
   * @returns Object containing accessToken and user data.
   * @throws UnauthorizedException if login fails.
   */
  async biometricLogin(
    email: string,
    biometricKey: string,
  ): Promise<{ accessToken: string; user: UserEntity }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.biometricKey !== biometricKey) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };

    try {
      const accessToken = this.jwtService.sign(payload);
      return { accessToken, user };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * Fetches a user by ID.
   * @param id - User ID.
   * @returns User entity.
   */
  async findById(id: number): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Add more CRUD methods as needed
}
