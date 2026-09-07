import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorSummaryDto } from './dto/vendor-summary.dto';
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
}
