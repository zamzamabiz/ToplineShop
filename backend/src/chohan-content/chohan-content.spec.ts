import 'reflect-metadata';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { REQUIRES_TENANT_CONTEXT_KEY } from '../auth/decorators/tenant-context.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';
import { ChohanContentController } from './chohan-content.controller';
import { ChohanContentService } from './chohan-content.service';

describe('Chohan content governance metadata', () => {
  const controller = ChohanContentController.prototype;

  it('keeps only the public aggregate unauthenticated', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.getPublic)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.getPublicMedia)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.getDraft)).toBeUndefined();
    expect(Reflect.getMetadata(REQUIRES_TENANT_CONTEXT_KEY, controller.getDraft)).toBe(true);
  });

  it('requires reviewer roles for publication and rollback', () => {
    const publishRoles = Reflect.getMetadata(ROLES_KEY, controller.publish) as string[];
    const rollbackRoles = Reflect.getMetadata(ROLES_KEY, controller.rollback) as string[];
    expect(publishRoles).toContain(Role.REVIEWER);
    expect(rollbackRoles).toContain(Role.SITE_ADMIN);
    expect(publishRoles).not.toContain(Role.SITE_EDITOR);
  });

  it('keeps media writes tenant-scoped', () => {
    expect(Reflect.getMetadata(REQUIRES_TENANT_CONTEXT_KEY, controller.registerMedia)).toBe(true);
    expect(Reflect.getMetadata(ROLES_KEY, controller.registerMedia)).toContain(Role.MEDIA_MANAGER);
  });

  it('requires tenant scope when streaming public media', async () => {
    const findFirst = jest.fn().mockResolvedValue({ storageKey: 'chohan/tenant-a/image.webp', mimeType: 'image/webp' });
    const createReadStream = jest.fn().mockReturnValue('stream');
    const service = new ChohanContentService(
      { chohanMediaAsset: { findFirst } } as never,
      {} as never,
      { createReadStream } as never,
    );

    await expect(service.getPublicMedia('tenant-a', 'asset-a')).resolves.toEqual({ mimeType: 'image/webp', stream: 'stream' });
    expect(findFirst).toHaveBeenCalledWith({ where: { id: 'asset-a', tenantId: 'tenant-a', status: 'ACTIVE' } });
    expect(createReadStream).toHaveBeenCalledWith('chohan/tenant-a/image.webp');
  });
});
