import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Token expiration is handled
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validates the JWT payload.
   * @param payload - JWT payload containing user information.
   * @returns User entity if validation is successful.
   */
  async validate(payload: { sub: number; email: string }): Promise<User> {
    const user = await this.authService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    console.log('User:', user);
    return user;
  }
}
