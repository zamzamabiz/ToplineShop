import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { ApiResponse, success } from '../common/api-response';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId?: string,
    vendorId?: string,
    categoryId?: string,
    status?: string,
  ): Promise<ApiResponse<ProductSummaryDto[]>> {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (vendorId) where.vendorId = vendorId;
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        vendorId: true,
        categoryId: true,
        name: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(products, { count: products.length, phase: 'P5-007' });
  }

  async findOne(id: string): Promise<ApiResponse<ProductSummaryDto>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        vendorId: true,
        categoryId: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return success(product, { phase: 'P5-007' });
  }
}
