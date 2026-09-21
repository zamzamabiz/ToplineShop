import { Controller, Get, Header, Headers, Res } from '@nestjs/common';
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
   * Protected by METRICS_TOKEN bearer authentication:
   * - METRICS_TOKEN set → requires `Authorization: Bearer <token>` header.
   * - METRICS_TOKEN not set in production → 401 for all requests.
   * - METRICS_TOKEN not set in development → open (convenient for local dev).
   *
   * In production, METRICS_TOKEN must be configured and the scrape target
   * must supply it. The endpoint should also be network-restricted (not
   * publicly reachable) via reverse-proxy or firewall rules.
   */
  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(
    @Res({ passthrough: true }) res: Response,
    @Headers('authorization') auth: string | undefined,
  ) {
    const token = process.env['METRICS_TOKEN'];
    if (token) {
      if (auth !== `Bearer ${token}`) {
        res.status(401).send('Unauthorized');
        return;
      }
    } else if (process.env['NODE_ENV'] === 'production') {
      res.status(401).send('Unauthorized — METRICS_TOKEN must be configured in production');
      return;
    }
    res.setHeader('Cache-Control', 'no-store, no-cache');
    return this.metrics.toPrometheus();
  }
}
