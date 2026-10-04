import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyEventDto } from './dto/company-event.dto';
import { GalleryItemDto } from './dto/gallery-item.dto';
import { SiteConfigDto } from './dto/site-config.dto';
import { MediaAssetDto } from './dto/media-asset.dto';
import { MediaUploadDto } from './dto/media-upload.dto';
import { StorageService } from '../trade-data-refinery/ingestion/storage/storage.service';
import { randomUUID } from 'crypto';

const DEFAULT_CONFIG = { themeKey: 'mint-executive', primaryColor: '#0f5b55', accentColor: '#ee765d', canvasColor: '#f5f1e7' };

@Injectable()
export class ChohanContentService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly storage: StorageService) {}

  async getPublic(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const [config, gallery, events] = await Promise.all([
      this.prisma.chohanSiteConfig.findFirst({ where: { tenantId: tenant.id, status: 'PUBLISHED' } }),
      this.prisma.chohanGalleryItem.findMany({ where: { tenantId: tenant.id, status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.chohanCompanyEvent.findMany({ where: { tenantId: tenant.id, status: 'PUBLISHED' }, orderBy: { startsAt: 'asc' } }),
    ]);
    return { config: config ? this.publicConfig(config) : null, gallery, events };
  }

  async getDraft(tenantId: string) { return this.prisma.chohanSiteConfig.findUnique({ where: { tenantId } }); }

  async saveDraft(tenantId: string, actorUserId: string, dto: SiteConfigDto) {
    const current = await this.prisma.chohanSiteConfig.findUnique({ where: { tenantId } });
    const next = { ...DEFAULT_CONFIG, ...(current ?? {}), ...dto };
    const draftJson = this.contentJson(dto);
    const record = await this.prisma.chohanSiteConfig.upsert({
      where: { tenantId },
      create: { tenantId, updatedById: actorUserId, ...this.themeFields(next), draftJson: draftJson as Prisma.InputJsonValue },
      update: { updatedById: actorUserId, ...this.themeFields(next), draftJson: draftJson as Prisma.InputJsonValue, status: 'DRAFT', revision: { increment: 1 } },
    });
    await this.prisma.chohanContentRevision.create({
      data: { tenantId, configId: record.id, revision: record.revision, status: 'DRAFT', payload: draftJson as Prisma.InputJsonValue, createdById: actorUserId },
    });
    await this.audit.recordEvent({ action: 'chohan.content.draft_saved', entityType: 'chohan_site_config', entityId: record.id, tenantId, actorUserId });
    return record;
  }

  async submitForReview(tenantId: string, actorUserId: string) {
    const draft = await this.prisma.chohanSiteConfig.findUnique({ where: { tenantId } });
    if (!draft) throw new NotFoundException('No Chohan draft exists');
    const record = await this.prisma.chohanSiteConfig.update({ where: { tenantId }, data: { status: 'PENDING_REVIEW', updatedById: actorUserId } });
    await this.prisma.chohanContentRevision.updateMany({ where: { configId: record.id, revision: record.revision, status: 'DRAFT' }, data: { status: 'PENDING_REVIEW' } });
    await this.audit.recordEvent({ action: 'chohan.content.review_requested', entityType: 'chohan_site_config', entityId: record.id, tenantId, actorUserId, metadata: { revision: record.revision } });
    return record;
  }

  async publish(tenantId: string, actorUserId: string) {
    const draft = await this.prisma.chohanSiteConfig.findUnique({ where: { tenantId } });
    if (!draft) throw new NotFoundException('No Chohan draft exists');
    if (draft.status !== 'PENDING_REVIEW') throw new NotFoundException('Draft must be submitted for review before publishing');
    const record = await this.prisma.chohanSiteConfig.update({ where: { tenantId }, data: { status: 'PUBLISHED', publishedJson: draft.draftJson, updatedById: actorUserId } });
    await this.prisma.chohanContentRevision.updateMany({ where: { configId: record.id, revision: record.revision, status: 'PENDING_REVIEW' }, data: { status: 'PUBLISHED', reviewedById: actorUserId, reviewedAt: new Date() } });
    await this.audit.recordEvent({ action: 'chohan.content.published', entityType: 'chohan_site_config', entityId: record.id, tenantId, actorUserId, metadata: { revision: record.revision } });
    return record;
  }

  async listRevisions(tenantId: string) {
    return this.prisma.chohanContentRevision.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async rollbackToRevision(tenantId: string, actorUserId: string, revision: number) {
    const source = await this.prisma.chohanContentRevision.findFirst({ where: { tenantId, revision, status: 'PUBLISHED' } });
    if (!source) throw new NotFoundException('Published revision not found');
    const config = await this.prisma.chohanSiteConfig.findUnique({ where: { tenantId } });
    if (!config) throw new NotFoundException('No Chohan site configuration exists');
    const nextRevision = config.revision + 1;
    const record = await this.prisma.chohanSiteConfig.update({
      where: { tenantId },
      data: { status: 'DRAFT', draftJson: source.payload, revision: nextRevision, updatedById: actorUserId },
    });
    await this.prisma.chohanContentRevision.create({
      data: { tenantId, configId: record.id, revision: nextRevision, status: 'DRAFT', payload: source.payload, createdById: actorUserId },
    });
    await this.audit.recordEvent({ action: 'chohan.content.rollback_requested', entityType: 'chohan_site_config', entityId: record.id, tenantId, actorUserId, metadata: { sourceRevision: revision, newRevision: nextRevision } });
    return record;
  }

  async listGallery(tenantId: string, publishedOnly = false) { return this.prisma.chohanGalleryItem.findMany({ where: { tenantId, ...(publishedOnly ? { status: 'PUBLISHED' } : {}) }, orderBy: { sortOrder: 'asc' } }); }

  async createGallery(tenantId: string, actorUserId: string, dto: GalleryItemDto) {
    const item = await this.prisma.chohanGalleryItem.create({ data: { tenantId, ...dto } });
    await this.audit.recordEvent({ action: 'chohan.gallery.created', entityType: 'chohan_gallery_item', entityId: item.id, tenantId, actorUserId });
    return item;
  }

  async publishGallery(tenantId: string, actorUserId: string, id: string) {
    const item = await this.prisma.chohanGalleryItem.update({ where: { id, tenantId }, data: { status: 'PUBLISHED' } });
    await this.audit.recordEvent({ action: 'chohan.gallery.published', entityType: 'chohan_gallery_item', entityId: id, tenantId, actorUserId });
    return item;
  }

  async listEvents(tenantId: string, publishedOnly = false) { return this.prisma.chohanCompanyEvent.findMany({ where: { tenantId, ...(publishedOnly ? { status: 'PUBLISHED' } : {}) }, orderBy: { startsAt: 'asc' } }); }

  async createEvent(tenantId: string, actorUserId: string, dto: CompanyEventDto) {
    const event = await this.prisma.chohanCompanyEvent.create({ data: { tenantId, ...dto, startsAt: new Date(dto.startsAt) } });
    await this.audit.recordEvent({ action: 'chohan.event.created', entityType: 'chohan_company_event', entityId: event.id, tenantId, actorUserId });
    return event;
  }

  async publishEvent(tenantId: string, actorUserId: string, id: string) {
    const event = await this.prisma.chohanCompanyEvent.update({ where: { id, tenantId }, data: { status: 'PUBLISHED' } });
    await this.audit.recordEvent({ action: 'chohan.event.published', entityType: 'chohan_company_event', entityId: id, tenantId, actorUserId });
    return event;
  }

  async listMedia(tenantId: string) {
    return this.prisma.chohanMediaAsset.findMany({ where: { tenantId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
  }

  async getPublicMedia(tenantId: string, id: string) {
    const asset = await this.prisma.chohanMediaAsset.findFirst({ where: { id, tenantId, status: 'ACTIVE' } });
    if (!asset?.storageKey) throw new NotFoundException('Media asset not found');
    return { mimeType: asset.mimeType, stream: this.storage.createReadStream(asset.storageKey) };
  }

  async registerMedia(tenantId: string, actorUserId: string, dto: MediaAssetDto) {
    const asset = await this.prisma.chohanMediaAsset.create({ data: { tenantId, createdById: actorUserId, ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined } });
    await this.audit.recordEvent({ action: 'chohan.media.registered', entityType: 'chohan_media_asset', entityId: asset.id, tenantId, actorUserId, metadata: { mimeType: asset.mimeType, storageKey: asset.storageKey } });
    return asset;
  }

  async uploadMedia(tenantId: string, actorUserId: string, file: { path: string; originalname: string; mimetype: string }, dto: MediaUploadDto) {
    const assetId = randomUUID();
    const safeName = file.originalname.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload';
    const storageKey = `chohan/${tenantId}/${assetId}-${safeName}`;
    await this.storage.persist(file.path, storageKey);
    try {
      const asset = await this.prisma.chohanMediaAsset.create({ data: { id: assetId, tenantId, createdById: actorUserId, url: `/chohan-content/media/${tenantId}/${assetId}`, storageKey, mimeType: file.mimetype, altText: dto.altText, caption: dto.caption, rightsNote: dto.rightsNote, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined } });
      await this.audit.recordEvent({ action: 'chohan.media.uploaded', entityType: 'chohan_media_asset', entityId: asset.id, tenantId, actorUserId, metadata: { storageKey, mimeType: file.mimetype } });
      return asset;
    } catch (error) {
      await this.storage.removeSafe(storageKey);
      throw error;
    }
  }

  private themeFields(value: Record<string, unknown>) { return { themeKey: String(value.themeKey), primaryColor: String(value.primaryColor), accentColor: String(value.accentColor), canvasColor: String(value.canvasColor) }; }
  private contentJson(dto: SiteConfigDto): Prisma.JsonObject { return Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined)) as Prisma.JsonObject; }
  private publicConfig(config: { themeKey: string; primaryColor: string; accentColor: string; canvasColor: string; publishedJson: Prisma.JsonValue | null }) { return { themeKey: config.themeKey, primaryColor: config.primaryColor, accentColor: config.accentColor, canvasColor: config.canvasColor, content: config.publishedJson }; }
}
