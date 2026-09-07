import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { success, ApiResponse } from './common/api-response';

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

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

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
      environment: process.env.NODE_ENV || 'development',
      checks: {
        api: 'ok',
        prisma: 'configured',
        database: dbStatus,
        auth: 'not_configured',
        payments: 'locked',
      },
    }, { phase: 'P5-002' });
  }

  getVersion(): ApiResponse<VersionData> {
    return success({
      service: 'toplineshop-api',
      version: '0.1.0',
      phase: 'P5-002',
    });
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'unavailable';
    }
  }
}
