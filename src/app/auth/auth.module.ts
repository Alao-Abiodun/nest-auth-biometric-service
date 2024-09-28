import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { AuthService } from './services/auth.service';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [AuthService, PrismaService, AuthResolver],
})
export class AuthModule {}
