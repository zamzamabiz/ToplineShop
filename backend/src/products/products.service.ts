import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { CreateProductDto } from './dto/create-product.dto';
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

  async create(dto: CreateProductDto): Promise<ApiResponse<ProductSummaryDto>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, tenantId: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.tenantId !== dto.tenantId) {
      throw new NotFoundException('Vendor not found');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true, tenantId: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.tenantId !== dto.tenantId) {
      throw new NotFoundException('Category not found');
    }

    const existing = await this.prisma.product.findFirst({
      where: { tenantId: dto.tenantId, slug: dto.slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Product with slug "${dto.slug}" already exists for this tenant`,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId: dto.tenantId,
        vendorId: dto.vendorId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        basePrice: dto.basePrice,
        currency: dto.currency ?? 'NGN',
        status: dto.status,
        inStock: dto.inStock ?? true,
      },
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

    return success(product, { phase: 'P7-007' });
  }
}
