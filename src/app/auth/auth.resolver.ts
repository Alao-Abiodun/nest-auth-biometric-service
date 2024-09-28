// src/users/users.resolver.ts

import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './services/auth.service';
import { UserEntity } from './entities/auth.entity';
import { CreateUserInput } from './dtos/create-user.dto';
import { LoginInput } from './dtos/login-user.dto';
import { LoginResponse } from './dtos/login-response.dto';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
// import { UpdateUserInput } from './dtos/update-user.dto';
// import { Prisma } from '@prisma/client';

@Resolver(() => UserEntity)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Query to fetch all users.
   * @returns Array of UserEntity.
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => [UserEntity], { name: 'users' })
  async getUsers(): Promise<UserEntity[]> {
    return this.authService.findAllUsers();
  }

  /**
   * Mutation to create a new user.
   * @param createUserInput - Data to create a user.
   * @returns Created UserEntity.
   */
  @Mutation(() => UserEntity)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<UserEntity> {
    // It's crucial to hash the password before saving to the database
    return this.authService.createUser({
      ...createUserInput,
    });
  }

  /**
   * Mutation for user standard login.
   * @param email - User email.
   * @param password - User password.
   * @returns UserEntity.
   * @throws Error if user is not found or password is incorrect.
   */
  @Mutation(() => LoginResponse)
  async login(
    @Args('loginInput') loginInput: LoginInput,
  ): Promise<LoginResponse> {
    try {
      const { accessToken, user } = await this.authService.login(
        loginInput.email,
        loginInput.password,
      );
      return {
        accessToken,
        user,
      };
    } catch (error) {
      console.log('Error:', error);
      throw new UnauthorizedException(error.message);
    }
  }
}
