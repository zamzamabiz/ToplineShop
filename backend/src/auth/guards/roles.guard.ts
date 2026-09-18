import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { REQUIRES_TENANT_CONTEXT_KEY } from '../decorators/tenant-context.decorator';
import { Role } from '../types/role.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: { roles?: string[]; tenantId?: string } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const userRoles: string[] = user.roles ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const requiresTenantContext = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_TENANT_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiresTenantContext && !user.tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    return true;
  }
}
