import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/services/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { UserEntity } from '../entities/auth.entity';
import { Helper } from '../../../shared/utils/helper';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private helper: Helper,
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

    const hashedPassword = await this.helper.hash(password);
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
      const accessToken = await this.helper.generateJwtToken(payload);
      return { accessToken, user };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * Sets up a biometric key for a user.
   * @param email - User email.
   * @param biometricKey - User biometric key.
   * @returns The updated user.
   * @throws ConflictException if biometric key is already in use.
   */
  async setupBiometricKey(
    email: string,
    biometricKey: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Hash the biometricKey using SHA-256
    const biometricKeyHash = crypto
      .createHash('sha256')
      .update(biometricKey)
      .digest('hex');

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          biometricKey: biometricKeyHash,
        },
      });
      return updatedUser as UserEntity;
    } catch (error: any) {
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('biometricKeyHash')
      ) {
        throw new ConflictException('Biometric key is already in use');
      }
      throw error;
    }
  }

  /**
   * Logs in a user using their biometric key.
   */
  async biometricLogin(
    biometricKey: string,
  ): Promise<{ accessToken: string; user: UserEntity }> {
    // Hash the incoming biometricKey using SHA-256
    const biometricKeyHash: any = crypto
      .createHash('sha256')
      .update(biometricKey)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: { biometricKey: biometricKeyHash },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid biometric key.');
    }

    const payload = { sub: user.id, email: user.email };

    try {
      const accessToken = await this.helper.generateJwtToken(payload);
      return { accessToken, user: user as unknown as UserEntity };
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
}
