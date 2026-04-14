import { Input, Mutation, Query, Router } from 'nestjs-trpc';
import { UsersService } from './users.service';
import { z } from 'zod';
import { createUserSchema, updateUserSchema, usersSchema } from './users.schema';
import { UserCreateInput, UserUpdateInput } from '@api/generated/prisma/models';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { AuthGuard } from '@api/src/infrastructure/decorators/auth/auth-guard.decorator';
import { Public } from '@api/src/infrastructure/decorators/auth/public-procedure.decorator';

@Router({ alias: 'users' })
@AuthGuard({ logs: true })
export class UserRouter {
  constructor(private readonly usersService: UsersService, private readonly authService: AuthService) { }

  @Public()
  @Query({
    input: z.object({ id: z.string() }),
    output: usersSchema,
  })
  read(@Input('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Public()
  @Query({
    output: z.array(usersSchema),
  })
  readAll() {
    return this.usersService.findAll();
  }

  @Public()
  @Mutation({
    input: createUserSchema,
    output: usersSchema,
  })
  create(@Input() userData: UserCreateInput) {
    return this.usersService.create(userData);
  }


  @Public()
  @Mutation({
    input: z.object({
      id: z.string(),
      data: updateUserSchema,
    }),
    output: usersSchema,
  })
  update(
    @Input('id') id: string,
    @Input('data') data: UserUpdateInput,
  ) {
    return this.usersService.update(id, data);
  }

  @Public()
  @Mutation({
    input: z.object({
      id: z.string(),
    }),
    output: usersSchema
  })
  delete(@Input('id') id: string) {
    return this.usersService.remove(id);
  }


}