import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { UserEntity } from '../entities/auth.entity';
import { Helper } from '../../../shared/utils/helper';

// Mock the argon2 library
jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: Partial<PrismaService>;
  let jwtService: Partial<JwtService>;
  let helper: Helper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        Helper,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    helper = module.get<Helper>(Helper);

    // Mock the helper.hash function
    jest
      .spyOn(helper, 'hash')
      .mockImplementation(async (password) => `hashed_${password}`);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      const userInput = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      jest.spyOn(helper, 'hash').mockResolvedValue(hashedPassword);

      const createdUser: User = {
        id: 1,
        email: userInput.email,
        password: hashedPassword,
        biometricKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock prismaService.user.create to resolve with createdUser
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(createdUser);

      const result = await authService.createUser(userInput);

      expect(helper.hash).toHaveBeenCalledWith(userInput.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: userInput.email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw an error if password is missing', async () => {
      const userInput = {
        email: 'john.doe@example.com',
        biometricKey: 'siakekweds',
      } as any; // Casting to any to simulate missing password

      await expect(authService.createUser(userInput)).rejects.toThrow(
        'Password is required',
      );

      expect(helper.hash).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
      const userInput = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      jest.spyOn(helper, 'hash').mockResolvedValue(hashedPassword);

      // Create a mocked Prisma P2002 error
      const prismaError = new Error('Email already exists');
      (prismaError as any).code = 'P2002';
      (prismaError as any).meta = { target: ['email'] };

      // Mock prismaService.user.create to reject with prismaError
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(prismaError);

      await expect(authService.createUser(userInput)).rejects.toThrow(
        'Email already exists',
      );

      expect(helper.hash).toHaveBeenCalledWith(userInput.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: userInput.email,
          password: hashedPassword,
        },
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user and return accessToken and user', async () => {
      const loginInput = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      const user: User = {
        id: 1,
        email: loginInput.email,
        password: hashedPassword,
        biometricKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      const token = 'jwtToken123';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.login(
        loginInput.email,
        loginInput.password,
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        hashedPassword,
        loginInput.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
      expect(result).toEqual({
        accessToken: token,
        user: user as unknown as UserEntity,
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        authService.login(loginInput.email, loginInput.password),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(argon2.verify).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw Error if password is incorrect', async () => {
      const loginInput = {
        email: 'john.doe@example.com',
        password: 'wrongPassword',
      };

      const hashedPassword = 'hashedPassword123';
      const user: User = {
        id: 1,
        email: loginInput.email,
        password: hashedPassword,
        biometricKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(
        authService.login(loginInput.email, loginInput.password),
      ).rejects.toThrow('Invalid credentials');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        hashedPassword,
        loginInput.password,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
