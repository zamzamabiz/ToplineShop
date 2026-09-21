import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from './common/api-response';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getRoot() {
    return this.appService.getRoot();
  }

  /** Legacy combined health endpoint — retained for backward compatibility. */
  @Public()
  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  /**
   * Liveness probe — returns 200 as long as the process is running.
   * Must NOT fail due to database unavailability.
   * Suitable for orchestrator liveness checks (e.g. Kubernetes livenessProbe).
   */
  @Public()
  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  /**
   * Readiness probe — returns 200 only when the application is ready to serve traffic.
   * Checks: database reachable, critical configuration present.
   * Returns 503 when not ready.
   * Suitable for orchestrator readiness checks (e.g. Kubernetes readinessProbe).
   */
  @Public()
  @Get('health/ready')
  async getReadiness() {
    return this.appService.getReadiness();
  }

  @Public()
  @Get('version')
  getVersion() {
    return this.appService.getVersion();
  }
}
