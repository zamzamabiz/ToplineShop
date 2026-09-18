import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async isModuleEnabled(tenantId: string): Promise<boolean> {
    const record = await this.prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'TRADE_DATA_REFINERY' } },
      select: { enabled: true },
    });
    return record?.enabled === true;
  }
}
