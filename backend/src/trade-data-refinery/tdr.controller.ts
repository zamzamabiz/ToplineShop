import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { TenantModuleGuard } from './guards/tenant-module.guard';
import { TdrService } from './services/tdr.service';
import { ListBatchesDto } from './dto/list-batches.dto';
import { ReplayBatchDto } from './dto/replay-batch.dto';
import { CorrectionDto } from './quality/correction/correction.dto';
import { ListQuarantineDto } from './quality/service/quarantine.service';
import { CorrectionService } from './quality/correction/correction.service';
import { QuarantineService } from './quality/service/quarantine.service';
import { TdrExportService } from './export/service/tdr-export.service';
import { CreateExportDto } from './export/dto/create-export.dto';

interface TdrRequest {
  user: AuthenticatedUser;
}

@Controller('tdr')
@UseGuards(TenantModuleGuard)
export class TdrController {
  constructor(
    private readonly tdrService: TdrService,
    private readonly correctionService: CorrectionService,
    private readonly quarantineService: QuarantineService,
    private readonly exportService: TdrExportService,
  ) {}

  // ── Core batch endpoints ────────────────────────────────────────────────────

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

  // ── Quarantine / quality endpoints ─────────────────────────────────────────

  @Get('batches/:batchId/quarantine')
  listQuarantine(
    @Param('batchId') batchId: string,
    @Req() req: TdrRequest,
    @Query() dto: ListQuarantineDto,
  ) {
    return this.quarantineService.listQuarantine(batchId, req.user.tenantId, dto);
  }

  @Get('batches/:batchId/records/:recordId/quality')
  getQualityDetail(
    @Param('batchId') batchId: string,
    @Param('recordId') recordId: string,
    @Req() req: TdrRequest,
  ) {
    return this.quarantineService.getQualityDetail(batchId, recordId, req.user.tenantId);
  }

  @Post('batches/:batchId/records/:recordId/correct')
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.IMPORT_MANAGER,
    Role.EXPORT_MANAGER,
  )
  applyCorrection(
    @Param('batchId') batchId: string,
    @Param('recordId') recordId: string,
    @Req() req: TdrRequest,
    @Body() dto: CorrectionDto,
  ) {
    return this.correctionService.applyCorrection(batchId, recordId, dto, req.user);
  }

  // ── Export endpoints ────────────────────────────────────────────────────────

  @Post('exports')
  createExport(@Req() req: TdrRequest, @Body() dto: CreateExportDto) {
    return this.exportService.createExport(dto, req.user);
  }

  @Get('exports/:id')
  getExportStatus(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.exportService.getExportStatus(id, req.user);
  }

  @Get('exports/:id/download')
  @Header('Content-Type', 'text/csv')
  async downloadExport(
    @Param('id') id: string,
    @Req() req: TdrRequest,
    @Res({ passthrough: true }) _res: Response,
  ) {
    return this.exportService.downloadExport(id, req.user);
  }
}
