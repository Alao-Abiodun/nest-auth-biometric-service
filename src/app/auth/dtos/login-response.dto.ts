// src/auth/dto/login.response.ts

import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../entities/auth.entity';

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;

  @Field(() => UserEntity)
  user: UserEntity;
}
