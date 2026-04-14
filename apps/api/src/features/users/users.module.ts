import { Module } from '@nestjs/common';

import { UsersService } from './users.service';
import { UserRouter } from './users.router';

@Module({
  controllers: [],
  providers: [UsersService, UserRouter],
  exports: [UserRouter],
})
export class UsersModule { }
