import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class Helper {
  constructor(private jwtService: JwtService) {}

  /**
   * This function is used to hash a password
   * @param password
   * @returns
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /**
   * This function is used to verify a password
   * @param hashedPassword
   * @param password
   * @returns
   */
  async verify(hashedPassword: string, password: string): Promise<boolean> {
    return argon2.verify(hashedPassword, password);
  }

  /**
   * This function is used to generate a JWT token
   * @param payload
   * @returns
   */
  async generateJwtToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload);
  }

  /**
   * This function is used to validate a JWT token
   * @param token
   * @returns string
   * */
  async validateJwtToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
