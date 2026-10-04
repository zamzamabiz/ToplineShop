import { Body, Controller, Get, Param, Patch, Post, Req, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Public } from '../auth/decorators/public.decorator';
import { RequiresTenantContext } from '../auth/decorators/tenant-context.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CompanyEventDto } from './dto/company-event.dto';
import { GalleryItemDto } from './dto/gallery-item.dto';
import { SiteConfigDto } from './dto/site-config.dto';
import { MediaAssetDto } from './dto/media-asset.dto';
import { MediaUploadDto } from './dto/media-upload.dto';
import { ChohanContentService } from './chohan-content.service';

type RequestWithUser = { user: AuthenticatedUser };
const EDITOR_ROLES = [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.SITE_ADMIN, Role.SITE_EDITOR, Role.MEDIA_MANAGER, Role.EVENT_MANAGER];
const REVIEWER_ROLES = [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.SITE_ADMIN, Role.REVIEWER];
const MEDIA_TMP_DIR = path.join(os.tmpdir(), 'chohan-media');
fs.mkdirSync(MEDIA_TMP_DIR, { recursive: true });

@Controller('chohan-content')
export class ChohanContentController {
  constructor(private readonly content: ChohanContentService) {}
  @Public() @Get('public/:tenantSlug') getPublic(@Param('tenantSlug') tenantSlug: string) { return this.content.getPublic(tenantSlug); }
  @Public() @Get('media/:tenantId/:id') async getPublicMedia(@Param('tenantId') tenantId: string, @Param('id') id: string) { const asset = await this.content.getPublicMedia(tenantId, id); return new StreamableFile(asset.stream, { type: asset.mimeType }); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Get('draft') getDraft(@Req() req: RequestWithUser) { return this.content.getDraft(req.user.tenantId); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Patch('draft') saveDraft(@Req() req: RequestWithUser, @Body() dto: SiteConfigDto) { return this.content.saveDraft(req.user.tenantId, req.user.userId, dto); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Post('review') submitForReview(@Req() req: RequestWithUser) { return this.content.submitForReview(req.user.tenantId, req.user.userId); }
  @Roles(...REVIEWER_ROLES) @RequiresTenantContext() @Post('publish') publish(@Req() req: RequestWithUser) { return this.content.publish(req.user.tenantId, req.user.userId); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Get('revisions') revisions(@Req() req: RequestWithUser) { return this.content.listRevisions(req.user.tenantId); }
  @Roles(...REVIEWER_ROLES) @RequiresTenantContext() @Post('rollback/:revision') rollback(@Req() req: RequestWithUser, @Param('revision') revision: string) { return this.content.rollbackToRevision(req.user.tenantId, req.user.userId, Number(revision)); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Get('gallery') gallery(@Req() req: RequestWithUser) { return this.content.listGallery(req.user.tenantId); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Post('gallery') createGallery(@Req() req: RequestWithUser, @Body() dto: GalleryItemDto) { return this.content.createGallery(req.user.tenantId, req.user.userId, dto); }
  @Roles(...REVIEWER_ROLES) @RequiresTenantContext() @Post('gallery/:id/publish') publishGallery(@Req() req: RequestWithUser, @Param('id') id: string) { return this.content.publishGallery(req.user.tenantId, req.user.userId, id); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Get('events') events(@Req() req: RequestWithUser) { return this.content.listEvents(req.user.tenantId); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Post('events') createEvent(@Req() req: RequestWithUser, @Body() dto: CompanyEventDto) { return this.content.createEvent(req.user.tenantId, req.user.userId, dto); }
  @Roles(...REVIEWER_ROLES) @RequiresTenantContext() @Post('events/:id/publish') publishEvent(@Req() req: RequestWithUser, @Param('id') id: string) { return this.content.publishEvent(req.user.tenantId, req.user.userId, id); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Get('media') media(@Req() req: RequestWithUser) { return this.content.listMedia(req.user.tenantId); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Post('media') registerMedia(@Req() req: RequestWithUser, @Body() dto: MediaAssetDto) { return this.content.registerMedia(req.user.tenantId, req.user.userId, dto); }
  @Roles(...EDITOR_ROLES) @RequiresTenantContext() @Post('media/upload') @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: MEDIA_TMP_DIR, filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '-')}`) }), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) })) uploadMedia(@Req() req: RequestWithUser, @UploadedFile() file: { path: string; originalname: string; mimetype: string }, @Body() dto: MediaUploadDto) { return this.content.uploadMedia(req.user.tenantId, req.user.userId, file, dto); }
}
