import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequiresTenantContext } from '../auth/decorators/tenant-context.decorator';
import { Role } from '../auth/types/role.type';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.categoriesService.findAll(tenantId, parentId);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.PROCUREMENT_MANAGER)
  @RequiresTenantContext()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }
}
