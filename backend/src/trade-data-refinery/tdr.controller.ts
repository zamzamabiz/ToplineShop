import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { Response as ExpressResponse } from 'express';
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
import { AnalyticsService } from './analytics/analytics.service';
import { RecordsService } from './analytics/records.service';
import { AnalyticsFilterDto, BreakdownDimension, TrendGranularity, TrendQueryDto, BreakdownQueryDto } from './analytics/dto/analytics-filter.dto';
import { ListRecordsDto } from './analytics/dto/list-records.dto';
import { TdrSourceLifecycleService } from './services/tdr-source-lifecycle.service';
import { TdrVersioningService } from './services/tdr-versioning.service';
import { TdrDeletionRequestService } from './services/tdr-deletion-request.service';
import { TdrApiKeyService } from './services/tdr-api-key.service';
import { TdrWebhookService } from './services/tdr-webhook.service';

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
    private readonly analyticsService: AnalyticsService,
    private readonly recordsService: RecordsService,
    private readonly lifecycleService: TdrSourceLifecycleService,
    private readonly versioningService: TdrVersioningService,
    private readonly deletionRequestService: TdrDeletionRequestService,
    private readonly apiKeyService: TdrApiKeyService,
    private readonly webhookService: TdrWebhookService,
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

  @Post('batches/:batchId/records/:recordId/re-evaluate')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  reEvaluateRecord(
    @Param('batchId') batchId: string,
    @Param('recordId') recordId: string,
    @Req() req: TdrRequest,
  ) {
    return this.correctionService.reEvaluateRecord(batchId, recordId, req.user.tenantId);
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

  @Get('exports/estimate')
  estimateExport(
    @Req() req: TdrRequest,
    @Query('batchId') batchId?: string,
  ) {
    return this.exportService.estimateExport({ batchId }, req.user);
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
    @Res({ passthrough: true }) _res: ExpressResponse,
  ) {
    return this.exportService.downloadExport(id, req.user);
  }

  // ── Source file lifecycle endpoints ────────────────────────────────────────

  @Post('source-files/:id/archive')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  archiveSourceFile(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.lifecycleService.archiveSourceFile(id, req.user);
  }

  @Post('source-files/:id/restore')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  restoreSourceFile(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.lifecycleService.restoreSourceFile(id, req.user);
  }

  @Get('source-files/:id/download')
  async downloadSourceFile(
    @Param('id') id: string,
    @Req() req: TdrRequest,
    @Res({ passthrough: true }) _res: ExpressResponse,
  ) {
    return this.lifecycleService.downloadSourceFile(id, req.user);
  }

  // ── Analytics endpoints ───────────────────────────────────────────────────

  @Get('analytics/summary')
  getAnalyticsSummary(
    @Req() req: TdrRequest,
    @Query() dto: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getSummary(req.user.tenantId, dto);
  }

  @Get('analytics/trend')
  getAnalyticsTrend(
    @Req() req: TdrRequest,
    @Query() dto: TrendQueryDto,
  ) {
    const safeGranularity =
      dto.granularity && Object.values(TrendGranularity).includes(dto.granularity)
        ? dto.granularity
        : TrendGranularity.MONTH;
    return this.analyticsService.getTrend(req.user.tenantId, dto, safeGranularity);
  }

  @Get('analytics/breakdown')
  getAnalyticsBreakdown(
    @Req() req: TdrRequest,
    @Query() dto: BreakdownQueryDto,
  ) {
    const safeDimension =
      dto.dimension && Object.values(BreakdownDimension).includes(dto.dimension)
        ? dto.dimension
        : BreakdownDimension.TRADE_DIRECTION;
    const safeTopN = Math.min(Math.max(1, parseInt(dto.topN ?? '20', 10) || 20), 100);
    return this.analyticsService.getBreakdown(
      req.user.tenantId,
      dto,
      safeDimension,
      safeTopN,
    );
  }

  @Get('analytics/filter-options')
  getAnalyticsFilterOptions(@Req() req: TdrRequest) {
    return this.analyticsService.getFilterOptions(req.user.tenantId);
  }

  // ── Records endpoint ──────────────────────────────────────────────────────

  @Get('records')
  listRecords(@Req() req: TdrRequest, @Query() dto: ListRecordsDto) {
    return this.recordsService.listRecords(req.user.tenantId, dto);
  }

  // ── Versioning endpoints ──────────────────────────────────────────────────

  @Post('source-files/:id/replace')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (_req, _file, cb) => cb(null, `tdr-replace-${randomUUID()}`),
      }),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  replaceSourceFile(
    @Param('id') id: string,
    @Req() req: TdrRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('replacementReason') replacementReason: string,
    @Body('mappingProfileId') mappingProfileId?: string,
  ) {
    return this.versioningService.createReplacement({
      file,
      previousSourceFileId: id,
      replacementReason: replacementReason ?? '',
      mappingProfileId,
      user: req.user,
    });
  }

  @Get('lineage/:logicalDatasetId')
  getLineage(
    @Param('logicalDatasetId') logicalDatasetId: string,
    @Req() req: TdrRequest,
  ) {
    return this.versioningService.getLineage(logicalDatasetId, req.user);
  }

  // ── Deletion request endpoints ────────────────────────────────────────────

  @Post('source-files/:id/deletion-requests')
  createDeletionRequest(
    @Param('id') sourceFileId: string,
    @Req() req: TdrRequest,
    @Body('reason') reason: string,
  ) {
    return this.deletionRequestService.create(sourceFileId, reason, req.user);
  }

  @Get('deletion-requests')
  listDeletionRequests(
    @Req() req: TdrRequest,
    @Query('status') status?: string,
  ) {
    return this.deletionRequestService.list(req.user, status);
  }

  @Post('deletion-requests/:id/approve')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  approveDeletionRequest(
    @Param('id') id: string,
    @Req() req: TdrRequest,
    @Body('reviewNote') reviewNote?: string,
  ) {
    return this.deletionRequestService.approve(id, reviewNote, req.user);
  }

  @Post('deletion-requests/:id/reject')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  rejectDeletionRequest(
    @Param('id') id: string,
    @Req() req: TdrRequest,
    @Body('reviewNote') reviewNote?: string,
  ) {
    return this.deletionRequestService.reject(id, reviewNote, req.user);
  }

  @Post('deletion-requests/:id/cancel')
  cancelDeletionRequest(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.deletionRequestService.cancel(id, req.user);
  }

  // ── API key endpoints ─────────────────────────────────────────────────────

  @Post('api-keys')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  createApiKey(
    @Req() req: TdrRequest,
    @Body('name') name: string,
    @Body('scopes') scopes: string[],
    @Body('expiresAt') expiresAt?: string,
  ) {
    return this.apiKeyService.create(
      name,
      scopes,
      expiresAt ? new Date(expiresAt) : undefined,
      req.user,
    );
  }

  @Get('api-keys')
  listApiKeys(@Req() req: TdrRequest) {
    return this.apiKeyService.list(req.user);
  }

  @Delete('api-keys/:id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  revokeApiKey(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.apiKeyService.revoke(id, req.user);
  }

  // ── Webhook endpoints ─────────────────────────────────────────────────────

  @Post('webhooks')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  subscribeWebhook(
    @Req() req: TdrRequest,
    @Body('url') url: string,
    @Body('eventTypes') eventTypes: string[],
  ) {
    return this.webhookService.subscribe(url, eventTypes, req.user);
  }

  @Get('webhooks')
  listWebhooks(@Req() req: TdrRequest) {
    return this.webhookService.listSubscriptions(req.user);
  }

  @Delete('webhooks/:id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  unsubscribeWebhook(@Param('id') id: string, @Req() req: TdrRequest) {
    return this.webhookService.unsubscribe(id, req.user);
  }
}
