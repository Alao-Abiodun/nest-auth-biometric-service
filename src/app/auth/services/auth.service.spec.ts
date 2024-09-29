// src/app/auth/services/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { UserEntity } from '../entities/auth.entity';

// Mock the argon2 library
jest.mock('argon2');

// Define interfaces for mocked services
interface MockPrismaService {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
}

interface MockJwtService {
  sign: jest.Mock;
}

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: MockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as unknown as MockPrismaService;
    jwtService = module.get<JwtService>(
      JwtService,
    ) as unknown as MockJwtService;
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
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const createdUser: User = {
        id: 1,
        email: userInput.email,
        password: hashedPassword,
        biometricKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Cast prismaService.user.create as jest.Mock and mock resolved value
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await authService.createUser(userInput);

      expect(argon2.hash).toHaveBeenCalledWith(userInput.password);
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

      expect(argon2.hash).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
      const userInput = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Create a mocked Prisma P2002 error
      const prismaError = new Error('Email already exists');
      (prismaError as any).code = 'P2002';
      (prismaError as any).meta = { target: ['email'] };

      // Mock the rejection with the proper error instance
      (prismaService.user.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(authService.createUser(userInput)).rejects.toThrow(
        'Email already exists',
      );

      expect(argon2.hash).toHaveBeenCalledWith(userInput.password);
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

      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);

      const payload = { sub: user.id, email: user.email };
      const token = 'jwtToken123';
      (jwtService.sign as jest.Mock).mockReturnValue(token);

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
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
      expect(result).toEqual({
        accessToken: token,
        user: user as unknown as UserEntity, // Adjust if necessary
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

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

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

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
