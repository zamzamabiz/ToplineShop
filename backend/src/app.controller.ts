import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): { message: string; status: string } {
    return this.appService.getRoot();
  }

  @Get('health')
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
    return this.appService.getHealth();
  }

  @Get('version')
  getVersion(): { service: string; version: string; phase: string } {
    return this.appService.getVersion();
  }
}
