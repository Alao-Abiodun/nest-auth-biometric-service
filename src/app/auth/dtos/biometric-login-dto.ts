import { InputType, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class BiometricLoginInput {
  @Field()
  biometricKey: string;

  @Field()
  @IsEmail()
  email: string;
}
