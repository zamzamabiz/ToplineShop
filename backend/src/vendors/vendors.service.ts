import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorSummaryDto } from './dto/vendor-summary.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ApiResponse, success } from '../common/api-response';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId?: string): Promise<ApiResponse<VendorSummaryDto[]>> {
    const where = tenantId ? { tenantId } : {};

    const vendors = await this.prisma.vendor.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(vendors, { count: vendors.length, phase: 'P5-005' });
  }

  async findOne(id: string): Promise<ApiResponse<VendorSummaryDto>> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return success(vendor, { phase: 'P5-005' });
  }

  async create(dto: CreateVendorDto): Promise<ApiResponse<VendorSummaryDto>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existing = await this.prisma.vendor.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Vendor with slug "${dto.slug}" already exists`);
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        slug: dto.slug,
        status: dto.status,
        description: dto.description,
        logo: dto.logo,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return success(vendor, { phase: 'P7-005' });
  }
}
