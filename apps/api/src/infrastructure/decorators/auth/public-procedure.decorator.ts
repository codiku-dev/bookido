import { UseMiddlewares } from 'nestjs-trpc';
import { PublicProcedureMiddleware } from '@api/src/infrastructure/middlewares/public-procedure.middleware';

/** Shorthand for @UseMiddlewares(PublicProcedureMiddleware). Marks the procedure as public (optional auth). */
export function Public() {
  return UseMiddlewares(PublicProcedureMiddleware);
}
