import { UseMiddlewares } from 'nestjs-trpc';
import { RolesProcedureMiddleware } from '@api/src/infrastructure/middlewares/roles-procedure.middleware';

export const ROLES_METADATA_KEY = 'trpc:roles';

/**
 * Restricts the procedure to users that have one of the given roles.
 * Must be used with authenticated procedures (after AuthGuard).
 * Path is registered at startup by RolesPathScannerService.
 */
export function Roles(allowedRoles: string[]) {
  const middlewareDecorator = UseMiddlewares(RolesProcedureMiddleware);
  return (target: object, propertyKey: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(ROLES_METADATA_KEY, allowedRoles, target, propertyKey);
    const desc = descriptor ?? Object.getOwnPropertyDescriptor(target, propertyKey);
    return desc ? middlewareDecorator(target, propertyKey, desc) : (target as object);
  };
}
