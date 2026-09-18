import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantModuleService } from '../services/tenant-module.service';

@Injectable()
export class TenantModuleGuard implements CanActivate {
  constructor(private readonly tenantModuleService: TenantModuleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { tenantId?: string } }>();

    if (!request.user) throw new UnauthorizedException();
    const { tenantId } = request.user;
    if (!tenantId) throw new ForbiddenException('Tenant context required');

    const enabled = await this.tenantModuleService.isModuleEnabled(tenantId);
    if (!enabled) {
      throw new ForbiddenException('TRADE_DATA_REFINERY module not enabled for tenant');
    }
    return true;
  }
}
