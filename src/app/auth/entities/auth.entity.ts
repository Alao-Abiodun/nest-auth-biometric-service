import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserEntity {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  biometricKey?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
