import { TRPCMiddleware, MiddlewareOptions } from 'nestjs-trpc';
import { Inject, Injectable, ConsoleLogger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { auth } from '@api/src/features/authentication/auth';
import { getBaseUrl } from '@api/src/infrastructure/utils/request-url';

// Set of procedure paths that have optional auth (e.g. @Public)
const optionalAuthPaths = new Set<string>();
// Set of procedure paths that explicitly require auth (e.g. @Private overrides @Public)
const privatePaths = new Set<string>();

const SEP = '────────────────────────────────────────────────────────';
const SEP_THIN = '────────────────────────────────────────────────';

@Injectable()
export class AuthGuardMiddleware implements TRPCMiddleware {
  constructor(
    @Inject(ConsoleLogger) private readonly logger: ConsoleLogger,
  ) { }

  async use(opts: MiddlewareOptions<{ req: any; res: any; optionalAuth?: boolean }>) {
    const { next, ctx, path, type } = opts;

    // Check if this procedure path has optional auth (@Private overrides @Public)
    const isOptionalAuth =
      !privatePaths.has(path) &&
      (optionalAuthPaths.has(path) || (ctx as any).optionalAuth);

    try {
      // Extract session from request (Better Auth parses cookies automatically)
      const session = await auth.api.getSession({
        headers: ctx.req.headers,
      });

      // Add user and session to context if authenticated
      if (session?.user && session?.session) {
        return next({
          ctx: {
            ...ctx,
            user: session.user,
            session: session.session,
          },
        });
      }

      // If optional auth, continue without throwing
      if (isOptionalAuth) {
        return next({
          ctx: {
            ...ctx,
            user: undefined,
            session: undefined,
          },
        });
      }

      this.logUnauthorized(path, type, ctx.req);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    } catch (error) {
      // If optional auth, continue without throwing
      if (isOptionalAuth) {
        return next({
          ctx: {
            ...ctx,
            user: undefined,
            session: undefined,
          },
        });
      }
      if (error instanceof TRPCError) throw error;
      this.logUnauthorized(path, type, ctx.req);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }
  }

  private logUnauthorized(path: string, type: string, req: { url?: string; method?: string; get?: (n: string) => string | undefined; protocol?: string }) {
    const baseUrl = req ? getBaseUrl(req) : '';
    const requestUrl = req?.url ?? (baseUrl ? `${baseUrl}/trpc/${path}` : path);
    const log = [
      '',
      SEP,
      '  UNAUTHORIZED (401)',
      SEP_THIN,
      `  path         ${path}`,
      `  type         ${type}`,
      `  request URL  ${requestUrl}`,
      SEP,
      '',
    ].join('\n');
    this.logger.warn(log);
  }

  static registerOptionalAuthPath(path: string) {
    optionalAuthPaths.add(path);
  }

  static unregisterOptionalAuthPath(path: string) {
    optionalAuthPaths.delete(path);
  }

  static registerPrivatePath(path: string) {
    privatePaths.add(path);
  }
}
