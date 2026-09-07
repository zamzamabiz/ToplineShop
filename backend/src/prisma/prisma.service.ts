import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Do not connect to database during bootstrap
    // Connection will be enabled when DATABASE_URL is configured
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
