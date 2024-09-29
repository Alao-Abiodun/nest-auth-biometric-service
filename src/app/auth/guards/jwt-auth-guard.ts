import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Extracts the request object from the GraphQL execution context.
   * This is essential for Passport to access the req.user property.
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  /**
   * Handles the authentication request.
   * Throws an UnauthorizedException if authentication fails.
   */
  handleRequest(err, user, info) {
    if (err || !user) {
      console.error('Authentication failed:', err || info);
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
