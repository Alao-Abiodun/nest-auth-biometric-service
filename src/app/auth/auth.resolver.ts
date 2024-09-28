// src/users/users.resolver.ts

import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './services/auth.service';
import { UserEntity } from './entities/auth.entity';
import { CreateUserInput } from './dtos/create-user.dto';
// import { UpdateUserInput } from './dtos/update-user.dto';
// import { Prisma } from '@prisma/client';

@Resolver(() => UserEntity)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Query to fetch all users.
   * @returns Array of UserEntity.
   */
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
  @Mutation(() => UserEntity)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<UserEntity> {
    return this.authService.login(email, password);
  }
}
