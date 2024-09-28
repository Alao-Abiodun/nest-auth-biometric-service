import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './services/auth.service';
import { UserEntity } from './entities/auth.entity';
import { CreateUserInput } from './dtos/create-user.dto';
import { LoginInput } from './dtos/login-user.dto';
import { LoginResponse } from './dtos/login-response.dto';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { BiometricSetupInput } from './dtos/setup-biometricKey.dto';
import { BiometricLoginInput } from './dtos/biometric-login-dto';
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

  /**
   * Mutation for user to setup a biometric key for login.
   * @param email - User email.
   * @param biometricKey - User biometric key.
   * @returns UserEntity.
   * @throws Error if user is not found or biometric key is incorrect.
   */
  @Mutation(() => UserEntity)
  async setupBiometricKey(
    @Args('setupBiometricKey') { email, biometricKey }: BiometricSetupInput,
  ): Promise<UserEntity> {
    return this.authService.setupBiometricKey(email, biometricKey);
  }

  /**
   * Mutation for user to login using biometric key.
   * @param email - User email.
   * @param biometricKey - User biometric key.
   * @returns UserEntity.
   * @throws Error if user is not found or biometric key is incorrect.
   */
  @Mutation(() => LoginResponse)
  async biometricLogin(
    @Args('biometricLogin') biometricLoginInput: BiometricLoginInput,
  ): Promise<LoginResponse> {
    try {
      const { accessToken, user } = await this.authService.biometricLogin(
        biometricLoginInput.email,
        biometricLoginInput.biometricKey,
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
