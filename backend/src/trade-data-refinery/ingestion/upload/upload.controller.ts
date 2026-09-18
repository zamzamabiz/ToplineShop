import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../auth/types/role.type';
import { AuthenticatedUser } from '../../../auth/types/jwt-payload.type';
import { TenantModuleGuard } from '../../guards/tenant-module.guard';
import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from '../constants/ingestion.limits';
import { UploadService } from './upload.service';
import { UploadBatchDto } from './upload.dto';
import { success } from '../../../common/api-response';

interface TdrRequest {
  user: AuthenticatedUser;
}

const TMP_DIR = path.join(os.tmpdir(), 'tdr-uploads');

@Controller('tdr')
@UseGuards(TenantModuleGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('batches/upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.IMPORT_MANAGER, Role.EXPORT_MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          fs.mkdirSync(TMP_DIR, { recursive: true });
          cb(null, TMP_DIR);
        },
        filename: (_req, _file, cb) => {
          cb(null, `${randomUUID()}.tmp`);
        },
      }),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(ext as never)) {
          return cb(
            new BadRequestException(
              `Unsupported file type "${ext}". Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadBatch(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadBatchDto,
    @Req() req: TdrRequest,
  ) {
    if (!file) {
      throw new BadRequestException('File field "file" is required');
    }
    const result = await this.uploadService.handleUpload(file, dto, req.user);
    return success(result);
  }
}
