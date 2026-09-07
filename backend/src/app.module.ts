import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { VendorsModule } from './vendors/vendors.module';
import { CategoriesModule } from './categories/categories.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [PrismaModule, TenantsModule, VendorsModule, CategoriesModule, AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
