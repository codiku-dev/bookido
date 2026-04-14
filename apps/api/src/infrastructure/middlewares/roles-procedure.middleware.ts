import { TRPCMiddleware, MiddlewareOptions } from 'nestjs-trpc';
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';

/** Path -> allowed roles (filled at startup by RolesPathScannerService). */
const pathRolesMap = new Map<string, string[]>();

@Injectable()
export class RolesProcedureMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions<{ req: unknown; res: unknown; user?: { role?: string }; session?: unknown }>) {
    const { next, ctx, path } = opts;
    const allowedRoles = pathRolesMap.get(path);
    if (!allowedRoles || allowedRoles.length === 0) {
      return next(opts);
    }
    const userRole = ctx.user?.role;
    if (userRole == null) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No role on user' });
    }
    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have the required role to access this resource`,
      });
    }
    return next(opts);
  }

  static registerPathRoles(path: string, roles: string[]) {
    pathRolesMap.set(path, roles);
  }
}
