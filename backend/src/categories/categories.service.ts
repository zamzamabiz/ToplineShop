import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategorySummaryDto } from './dto/category-summary.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiResponse, success } from '../common/api-response';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId?: string,
    parentId?: string,
  ): Promise<ApiResponse<CategorySummaryDto[]>> {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (parentId !== undefined)
      where.parentId = parentId === 'null' ? null : parentId;

    const categories = await this.prisma.category.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        parentId: true,
        name: true,
        status: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return success(categories, { count: categories.length, phase: 'P5-006' });
  }

  async findOne(id: string): Promise<ApiResponse<CategorySummaryDto>> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        parentId: true,
        name: true,
        status: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return success(category, { phase: 'P5-006' });
  }

  async create(dto: CreateCategoryDto): Promise<ApiResponse<CategorySummaryDto>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.parentId !== undefined) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { id: true, tenantId: true },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      if (parent.tenantId !== dto.tenantId) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const existing = await this.prisma.category.findFirst({
      where: { tenantId: dto.tenantId, slug: dto.slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Category with slug "${dto.slug}" already exists for this tenant`,
      );
    }

    const category = await this.prisma.category.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        slug: dto.slug,
        status: dto.status,
        icon: dto.icon,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
      select: {
        id: true,
        tenantId: true,
        parentId: true,
        name: true,
        status: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return success(category, { phase: 'P7-006' });
  }
}
