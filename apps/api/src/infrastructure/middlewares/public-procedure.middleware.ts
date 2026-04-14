import { TRPCMiddleware, MiddlewareOptions } from 'nestjs-trpc';
import { Injectable } from '@nestjs/common';
import { auth } from '@api/src/features/authentication/auth';

@Injectable()
export class PublicProcedureMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions<{ req: any; res: any }>) {
    const { next, ctx } = opts;

    // Public paths are pre-registered at startup by PublicPathScannerService.
    // AuthGuardMiddleware already allowed this request through.
    // if it threw an error, we need to handle auth ourselves
    // We'll extract session and call next() with proper context

    try {
      // Extract session from request (Better Auth parses cookies automatically)
      const session = await auth.api.getSession({
        headers: ctx.req.headers,
      });

      // Add user and session to context if authenticated, otherwise continue with undefined
      return next({
        ctx: {
          ...ctx,
          optionalAuth: true,
          user: session?.user || undefined,
          session: session?.session || undefined,
        },
      });
    } catch {
      // If session check fails, continue without user/session
      return next({
        ctx: {
          ...ctx,
          optionalAuth: true,
          user: undefined,
          session: undefined,
        },
      });
    }
  }
}

/** Alias for @UseMiddlewares(PublicProcedureMiddleware) — use @UseMiddlewares(Public) on public procedures. */
export const Public = PublicProcedureMiddleware;
