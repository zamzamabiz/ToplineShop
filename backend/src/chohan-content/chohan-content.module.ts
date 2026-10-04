import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TradeDataRefineryModule } from '../trade-data-refinery/trade-data-refinery.module';
import { ChohanContentController } from './chohan-content.controller';
import { ChohanContentService } from './chohan-content.service';

@Module({
  imports: [AuditModule, TradeDataRefineryModule],
  controllers: [ChohanContentController],
  providers: [ChohanContentService],
})
export class ChohanContentModule {}
