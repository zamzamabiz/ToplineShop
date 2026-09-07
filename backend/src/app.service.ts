import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): { message: string; status: string } {
    return {
      message: 'ToplineShop backend bootstrap is running',
      status: 'ok',
    };
  }

  getHealth(): {
    status: string;
    service: string;
    version: string;
    environment: string;
    checks: {
      api: string;
      database: string;
      auth: string;
      payments: string;
    };
  } {
    return {
      status: 'ok',
      service: 'toplineshop-api',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        api: 'ok',
        database: 'not_configured',
        auth: 'not_configured',
        payments: 'locked',
      },
    };
  }

  getVersion(): { service: string; version: string; phase: string } {
    return {
      service: 'toplineshop-api',
      version: '0.1.0',
      phase: 'P3-008',
    };
  }
}
