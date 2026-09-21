import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { ApiResponse } from './common/api-response';
import { Public } from './auth/decorators/public.decorator';
import { MetricsService } from './common/metrics/metrics.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly metrics: MetricsService,
  ) {}

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

  /**
   * Prometheus-compatible metrics endpoint.
   *
   * PRODUCTION NOTE: This endpoint must be protected at the network/proxy layer
   * (not publicly reachable). It contains no secrets, PII, or trade data,
   * but it does expose operational system state.
   *
   * Returns Prometheus text exposition format.
   */
  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache');
    return this.metrics.toPrometheus();
  }
}
