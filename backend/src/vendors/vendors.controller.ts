import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequiresTenantContext } from '../auth/decorators/tenant-context.decorator';
import { Role } from '../auth/types/role.type';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get()
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.vendorsService.findAll(tenantId);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.PROCUREMENT_MANAGER)
  @RequiresTenantContext()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }
}
