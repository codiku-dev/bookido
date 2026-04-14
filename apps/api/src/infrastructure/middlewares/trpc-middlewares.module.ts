import { ConsoleLogger, Global, Module } from '@nestjs/common';
import { LoggedMiddleware } from '@api/src/infrastructure/middlewares/logger.middleware';
import { AuthGuardMiddleware } from '@api/src/infrastructure/middlewares/auth-guard.middleware';
import { PublicProcedureMiddleware } from '@api/src/infrastructure/middlewares/public-procedure.middleware';
import { RolesProcedureMiddleware } from '@api/src/infrastructure/middlewares/roles-procedure.middleware';

@Global()
@Module({
  providers: [
    ConsoleLogger,
    LoggedMiddleware,
    AuthGuardMiddleware,
    PublicProcedureMiddleware,
    RolesProcedureMiddleware,
  ],
  exports: [
    LoggedMiddleware,
    AuthGuardMiddleware,
    PublicProcedureMiddleware,
    RolesProcedureMiddleware,
  ],
})
export class TrpcMiddlewaresModule { }
