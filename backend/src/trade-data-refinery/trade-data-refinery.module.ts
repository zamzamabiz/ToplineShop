import { Module } from '@nestjs/common';
import { TdrController } from './tdr.controller';
import { TdrService } from './services/tdr.service';
import { TenantModuleService } from './services/tenant-module.service';
import { TdrJobOrchestratorService } from './services/tdr-job-orchestrator.service';
import { TdrProcessorService } from './services/tdr-processor.service';
import { TenantModuleGuard } from './guards/tenant-module.guard';

@Module({
  controllers: [TdrController],
  providers: [
    TdrService,
    TenantModuleService,
    TdrJobOrchestratorService,
    TdrProcessorService,
    TenantModuleGuard,
  ],
  exports: [TdrJobOrchestratorService, TdrProcessorService],
})
export class TradeDataRefineryModule {}
