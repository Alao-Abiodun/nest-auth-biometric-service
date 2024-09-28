// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
  async login(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!(await argon2.verify(user.password, password))) {
      throw new Error('Incorrect password');
    }

    return user;
  }

  // Add more CRUD methods as needed
}
