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

  @Public()
  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  @Public()
  @Get('version')
  getVersion() {
    return this.appService.getVersion();
  }
}
