import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantSummaryDto } from './dto/tenant-summary.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
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

  async create(dto: CreateTenantDto): Promise<ApiResponse<TenantSummaryDto>> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        status: dto.status,
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return success(tenant, { phase: 'P7-004' });
  }
}
