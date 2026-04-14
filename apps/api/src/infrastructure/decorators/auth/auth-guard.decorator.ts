import { applyDecorators } from '@nestjs/common';
import { UseMiddlewares } from 'nestjs-trpc';
import { AuthGuardMiddleware } from '@api/src/infrastructure/middlewares/auth-guard.middleware';
import { LoggedMiddleware } from '@api/src/infrastructure/middlewares/logger.middleware';
import { getPrivateMethods } from '@api/src/infrastructure/decorators/auth/private-procedure.decorator';

type AuthGuardArgs = { logs?: boolean; enabled?: boolean };

function getRouterAlias(target: any): string {
  for (const key of Reflect.getOwnMetadataKeys(target)) {
    const meta = Reflect.getOwnMetadata(key, target);
    if (meta && typeof meta === 'object' && 'alias' in meta && 'path' in meta)
      return (meta as { alias?: string }).alias ?? 'app';
  }
  return 'app';
}

/**
 * Class decorator to add auth (and optional logging) to a tRPC router.
 * Use together with @Router() from nestjs-trpc so the generator can regenerate server.ts.
 * Public procedures: use @UseMiddlewares(Public) (paths are registered at startup by PublicPathScannerService).
 *
 * - logs: true → also apply request/response logging.
 * - enabled: false → no auth, only logging if logs: true (e.g. for auth router).
 */
export function AuthGuard(args: AuthGuardArgs = {}) {
  return (target: any) => {
    const alias = getRouterAlias(target);
    const { logs = false, enabled = true } = args;

    if (enabled) {
      for (const methodName of getPrivateMethods(target)) {
        AuthGuardMiddleware.unregisterOptionalAuthPath(`${alias}.${methodName}`);
        AuthGuardMiddleware.registerPrivatePath(`${alias}.${methodName}`);
      }
    }

    const middlewares =
      enabled && logs
        ? UseMiddlewares(AuthGuardMiddleware, LoggedMiddleware)
        : enabled
          ? UseMiddlewares(AuthGuardMiddleware)
          : logs
            ? UseMiddlewares(LoggedMiddleware)
            : null;

    if (!middlewares) return target;
    return applyDecorators(middlewares)(target);
  };
}
