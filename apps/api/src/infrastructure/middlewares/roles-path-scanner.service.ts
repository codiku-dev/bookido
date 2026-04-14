import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RolesProcedureMiddleware } from '@api/src/infrastructure/middlewares/roles-procedure.middleware';
import { ROLES_METADATA_KEY } from '@api/src/infrastructure/decorators/auth/roles-procedure.decorator';
import { TRPC_ROUTER_TYPES } from '@api/src/infrastructure/middlewares/public-path-scanner.service';

function getRouterAlias(routerClass: new (...args: unknown[]) => unknown): string | null {
  for (const key of Reflect.getOwnMetadataKeys(routerClass)) {
    const meta = Reflect.getOwnMetadata(key, routerClass);
    if (meta && typeof meta === 'object' && 'alias' in meta && 'path' in meta)
      return (meta as { alias?: string }).alias ?? 'app';
  }
  return null;
}

/**
 * Scans all tRPC routers at startup and registers path -> allowed roles
 * for procedures that use @Roles(...).
 */
@Injectable()
export class RolesPathScannerService implements OnModuleInit {
  constructor(
    @Inject(TRPC_ROUTER_TYPES) private readonly routerTypes: (new (...args: unknown[]) => unknown)[],
  ) {}

  onModuleInit() {
    for (const RouterClass of this.routerTypes) {
      try {
        const alias = getRouterAlias(RouterClass);
        if (!alias) continue;
        const prototype = RouterClass.prototype as Record<string, unknown>;
        const methodNames = Object.getOwnPropertyNames(prototype).filter(
          (name) => name !== 'constructor' && typeof prototype[name] === 'function',
        );
        for (const methodName of methodNames) {
          const roles = Reflect.getMetadata(ROLES_METADATA_KEY, prototype, methodName) as string[] | undefined;
          if (Array.isArray(roles) && roles.length > 0)
            RolesProcedureMiddleware.registerPathRoles(`${alias}.${methodName}`, roles);
        }
      } catch {
        // Router might not be in scope
      }
    }
  }
}
