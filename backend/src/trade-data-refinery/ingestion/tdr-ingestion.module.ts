import { Module } from '@nestjs/common';
import { StorageService } from './storage/storage.service';
import { MappingResolverService } from './mapping/mapping-resolver.service';
import { UploadService } from './upload/upload.service';
import { UploadController } from './upload/upload.controller';
import { TdrIngestionHandlerService } from './handler/tdr-ingestion-handler.service';

@Module({
  controllers: [UploadController],
  providers: [
    StorageService,
    MappingResolverService,
    UploadService,
    TdrIngestionHandlerService,
  ],
  exports: [StorageService, UploadService],
})
export class TdrIngestionModule {}
