import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { TenantModuleGuard } from './guards/tenant-module.guard';
import { TdrService } from './services/tdr.service';
import { ListBatchesDto } from './dto/list-batches.dto';
import { ReplayBatchDto } from './dto/replay-batch.dto';

interface TdrRequest {
  user: AuthenticatedUser;
}

@Controller('tdr')
@UseGuards(TenantModuleGuard)
export class TdrController {
  constructor(private readonly tdrService: TdrService) {}

  @Get('status')
  getStatus(@Req() req: TdrRequest) {
    return this.tdrService.getStatus(req.user.tenantId, req.user.userId);
  }

  @Get('batches')
  listBatches(@Req() req: TdrRequest, @Query() dto: ListBatchesDto) {
    return this.tdrService.listBatches(req.user.tenantId, dto);
  }

  @Get('batches/:id')
  getBatch(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.tdrService.getBatch(id, req.user.tenantId);
  }

  @Get('batches/:id/progress')
  getBatchProgress(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.tdrService.getBatchProgress(id, req.user.tenantId);
  }

  @Post('batches/:id/cancel')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  cancelBatch(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.tdrService.cancelBatch(id, req.user.tenantId, req.user.userId);
  }

  @Post('batches/:id/replay')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  replayBatch(
    @Param('id') id: string,
    @Req() req: TdrRequest,
    @Body() dto: ReplayBatchDto,
  ) {
    return this.tdrService.replayBatch(id, req.user.tenantId, req.user.userId, dto);
  }
}
