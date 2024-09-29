import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { AuthService } from './services/auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Helper } from 'src/shared/utils/helper';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, PrismaService, AuthResolver, Helper],
  exports: [],
})
export class AuthModule {}
