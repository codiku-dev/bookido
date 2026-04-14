import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AuthGuardMiddleware } from '@api/src/infrastructure/middlewares/auth-guard.middleware';
import { PublicProcedureMiddleware } from '@api/src/infrastructure/middlewares/public-procedure.middleware';

export const TRPC_ROUTER_TYPES = Symbol('TRPC_ROUTER_TYPES');

function getRouterAlias(routerClass: new (...args: any[]) => any): string | null {
  for (const key of Reflect.getOwnMetadataKeys(routerClass)) {
    const meta = Reflect.getOwnMetadata(key, routerClass);
    if (meta && typeof meta === 'object' && 'alias' in meta && 'path' in meta)
      return (meta as { alias?: string }).alias ?? 'app';
  }
  return null;
}

function procedureHasPublicMiddleware(prototype: object, methodName: string): boolean {
  const callback = (prototype as Record<string, unknown>)[methodName];
  if (typeof callback !== 'function') return false;
  for (const key of Reflect.getOwnMetadataKeys(callback)) {
    const val = Reflect.getOwnMetadata(key, callback);
    if (Array.isArray(val) && val.includes(PublicProcedureMiddleware)) return true;
  }
  return false;
}

/**
 * Scans all tRPC routers at startup and registers paths that use @UseMiddlewares(Public)
 * so AuthGuardMiddleware allows them without requiring auth.
 */
@Injectable()
export class PublicPathScannerService implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(TRPC_ROUTER_TYPES) private readonly routerTypes: (new (...args: any[]) => any)[],
  ) {}

  onModuleInit() {
    for (const RouterClass of this.routerTypes) {
      try {
        const instance = this.moduleRef.get(RouterClass, { strict: false });
        if (!instance) continue;
        const alias = getRouterAlias(RouterClass);
        if (!alias) continue;
        const prototype = Object.getPrototypeOf(instance);
        const methodNames = Object.getOwnPropertyNames(prototype).filter(
          (name) => name !== 'constructor' && typeof prototype[name] === 'function',
        );
        for (const methodName of methodNames) {
          if (procedureHasPublicMiddleware(prototype, methodName))
            AuthGuardMiddleware.registerOptionalAuthPath(`${alias}.${methodName}`);
        }
      } catch {
        // Router might not be in scope (e.g. not exported from feature module)
      }
    }
  }
}
