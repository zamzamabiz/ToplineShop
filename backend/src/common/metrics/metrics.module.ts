import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Global module — MetricsService is available everywhere without re-importing.
 */
@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
