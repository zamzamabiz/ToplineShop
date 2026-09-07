import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategorySummaryDto } from './dto/category-summary.dto';
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
}
