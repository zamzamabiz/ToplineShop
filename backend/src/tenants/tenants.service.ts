import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantSummaryDto } from './dto/tenant-summary.dto';
import { ApiResponse, success } from '../common/api-response';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ApiResponse<TenantSummaryDto[]>> {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(tenants, { count: tenants.length, phase: 'P5-003' });
  }

  async findOne(id: string): Promise<ApiResponse<TenantSummaryDto>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return success(tenant, { phase: 'P5-003' });
  }
}
