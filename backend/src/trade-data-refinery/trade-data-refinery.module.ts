import { Module } from '@nestjs/common';
import { TdrController } from './tdr.controller';
import { TdrService } from './services/tdr.service';
import { TenantModuleService } from './services/tenant-module.service';
import { TdrJobOrchestratorService } from './services/tdr-job-orchestrator.service';
import { TdrProcessorService } from './services/tdr-processor.service';
import { TenantModuleGuard } from './guards/tenant-module.guard';
import { StorageService } from './ingestion/storage/storage.service';
import { TempCleanupService } from './ingestion/storage/temp-cleanup.service';
import { MappingResolverService } from './ingestion/mapping/mapping-resolver.service';
import { UploadService } from './ingestion/upload/upload.service';
import { UploadController } from './ingestion/upload/upload.controller';
import { TdrIngestionHandlerService } from './ingestion/handler/tdr-ingestion-handler.service';
import { TdrQualityOrchestratorService } from './quality/orchestrator/tdr-quality-orchestrator.service';
import { TdrQualityHandlerService } from './quality/handler/tdr-quality-handler.service';
import { CorrectionService } from './quality/correction/correction.service';
import { QuarantineService } from './quality/service/quarantine.service';
import { TdrExportOrchestratorService } from './export/orchestrator/tdr-export-orchestrator.service';
import { TdrExportHandlerService } from './export/handler/tdr-export-handler.service';
import { TdrExportService } from './export/service/tdr-export.service';
import { TdrExportCleanupService } from './export/service/tdr-export-cleanup.service';
import { TdrSourceLifecycleService } from './services/tdr-source-lifecycle.service';
import { AnalyticsService } from './analytics/analytics.service';
import { RecordsService } from './analytics/records.service';
import { TdrVersioningService } from './services/tdr-versioning.service';
import { TdrDeletionRequestService } from './services/tdr-deletion-request.service';
import { TdrApiKeyService } from './services/tdr-api-key.service';
import { TdrWebhookService } from './services/tdr-webhook.service';

@Module({
  controllers: [TdrController, UploadController],
  providers: [
    TdrService,
    TenantModuleService,
    TdrJobOrchestratorService,
    TdrProcessorService,
    TenantModuleGuard,
    StorageService,
    TempCleanupService,
    MappingResolverService,
    UploadService,
    TdrIngestionHandlerService,
    TdrQualityOrchestratorService,
    TdrQualityHandlerService,
    CorrectionService,
    QuarantineService,
    TdrExportOrchestratorService,
    TdrExportHandlerService,
    TdrExportService,
    TdrExportCleanupService,
    TdrSourceLifecycleService,
    AnalyticsService,
    RecordsService,
    TdrVersioningService,
    TdrDeletionRequestService,
    TdrApiKeyService,
    TdrWebhookService,
  ],
  exports: [TdrJobOrchestratorService, TdrProcessorService],
})
export class TradeDataRefineryModule {}
