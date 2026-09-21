import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { success, ApiResponse } from './common/api-response';
import { MetricsService } from './common/metrics/metrics.service';

export interface RootData {
  message: string;
  status: string;
}

export interface HealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  checks: {
    api: string;
    prisma: string;
    database: string;
    auth: string;
    payments: string;
  };
}

export interface VersionData {
  service: string;
  version: string;
  phase: string;
}

export interface LivenessData {
  status: 'alive';
  uptime: number;
}

export interface ReadinessData {
  status: 'ready' | 'not_ready';
  checks: {
    database: 'ok' | 'unavailable';
    config: 'ok' | 'invalid';
  };
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  getRoot(): ApiResponse<RootData> {
    return success({
      message: 'ToplineShop backend bootstrap is running',
      status: 'ok',
    });
  }

  async getHealth(): Promise<ApiResponse<HealthData>> {
    const dbStatus = await this.checkDatabase();

    return success({
      status: 'ok',
      service: 'toplineshop-api',
      version: '0.1.0',
      environment: process.env['NODE_ENV'] ?? 'development',
      checks: {
        api: 'ok',
        prisma: 'configured',
        database: dbStatus,
        auth: 'configured',
        payments: 'locked',
      },
    }, { phase: 'P5-002' });
  }

  /** Liveness: process is running. Never fails due to DB. */
  getLiveness(): ApiResponse<LivenessData> {
    return success({ status: 'alive', uptime: process.uptime() });
  }

  /** Readiness: DB reachable and critical config present. */
  async getReadiness(): Promise<ApiResponse<ReadinessData>> {
    const database = await this.checkDatabase();
    const config = this.checkConfig();
    const ready = database === 'ok' && config === 'ok';

    const data: ReadinessData = {
      status: ready ? 'ready' : 'not_ready',
      checks: { database, config },
    };

    if (!ready) {
      throw new HttpException(
        { ok: false, data, error: { message: 'Service not ready', code: 'NOT_READY' } },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return success(data);
  }

  getVersion(): ApiResponse<VersionData> {
    return success({
      service: 'toplineshop-api',
      version: '0.1.0',
      phase: 'P5-002',
    });
  }

  private async checkDatabase(): Promise<'ok' | 'unavailable'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.metrics.recordDbReadiness(true);
      return 'ok';
    } catch {
      this.metrics.recordDbReadiness(false);
      return 'unavailable';
    }
  }

  private checkConfig(): 'ok' | 'invalid' {
    const accessSecret = process.env['JWT_ACCESS_SECRET'];
    const refreshSecret = process.env['JWT_REFRESH_SECRET'];
    const dbUrl = process.env['DATABASE_URL'];
    // In any env: must have these present (dev defaults are acceptable)
    if (!accessSecret || !refreshSecret || !dbUrl) return 'invalid';
    return 'ok';
  }
}
