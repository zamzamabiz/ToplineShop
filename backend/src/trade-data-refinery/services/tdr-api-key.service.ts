import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { Role } from '../../auth/types/role.type';
import { success } from '../../common/api-response';

export const VALID_SCOPES = ['records:read', 'exports:create', 'exports:read'] as const;
export type ApiKeyScope = (typeof VALID_SCOPES)[number];

const KEY_PREFIX_LENGTH = 8;
const KEY_RANDOM_BYTES = 24;
const KEY_PREFIX_DISPLAY = 8;

@Injectable()
export class TdrApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    name: string,
    scopes: string[],
    expiresAt: Date | undefined,
    user: AuthenticatedUser,
  ) {
    this.requireAdminRole(user.roles);
    this.validateScopes(scopes);

    // Generate key: prefix (8 hex chars) + '.' + 24 random bytes (48 hex chars)
    const prefixBytes = randomBytes(KEY_PREFIX_LENGTH / 2).toString('hex'); // 8 hex chars
    const bodyBytes = randomBytes(KEY_RANDOM_BYTES).toString('hex'); // 48 hex chars
    const plaintext = `tdr_${prefixBytes}.${bodyBytes}`;
    const keyPrefix = plaintext.slice(0, KEY_PREFIX_DISPLAY + 4); // 'tdr_' + 8 chars
    const keyHash = createHash('sha256').update(plaintext).digest('hex');

    const key = await this.prisma.tdrApiKey.create({
      data: {
        tenantId: user.tenantId,
        keyPrefix,
        keyHash,
        name,
        scopes,
        createdById: user.userId,
        expiresAt: expiresAt ?? null,
      },
    });

    await this.audit.recordEvent({
      action: 'tdr.api_key.created',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrApiKey',
      entityId: key.id,
      metadata: { name, scopes, keyPrefix },
    });

    return success({
      id: key.id,
      name: key.name,
      scopes: key.scopes,
      keyPrefix,
      // Plaintext returned ONCE on creation only; never stored
      key: plaintext,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    });
  }

  async list(user: AuthenticatedUser) {
    const keys = await this.prisma.tdrApiKey.findMany({
      where: { tenantId: user.tenantId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(keys);
  }

  async revoke(keyId: string, user: AuthenticatedUser) {
    this.requireAdminRole(user.roles);

    const key = await this.prisma.tdrApiKey.findFirst({
      where: { id: keyId, tenantId: user.tenantId },
      select: { id: true, revokedAt: true, name: true },
    });
    if (!key) throw new NotFoundException(`API key ${keyId} not found`);
    if (key.revokedAt) {
      return success({ id: key.id, revokedAt: key.revokedAt });
    }

    const updated = await this.prisma.tdrApiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    await this.audit.recordEvent({
      action: 'tdr.api_key.revoked',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrApiKey',
      entityId: keyId,
      metadata: { name: key.name },
    });

    return success({ id: updated.id, revokedAt: updated.revokedAt });
  }

  /** Authenticate a raw plaintext API key; returns the DB record or null. */
  async authenticate(plaintext: string): Promise<{ id: string; tenantId: string; scopes: string[] } | null> {
    const keyHash = createHash('sha256').update(plaintext).digest('hex');
    const key = await this.prisma.tdrApiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        tenantId: true,
        scopes: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!key) return null;
    if (key.revokedAt) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;

    // Update lastUsedAt without awaiting (fire-and-forget; not critical path)
    void this.prisma.tdrApiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {/* non-critical */});

    return { id: key.id, tenantId: key.tenantId, scopes: key.scopes };
  }

  private validateScopes(scopes: string[]): void {
    const invalid = scopes.filter((s) => !(VALID_SCOPES as readonly string[]).includes(s));
    if (invalid.length > 0) {
      throw new UnprocessableEntityException(
        `Invalid scopes: ${invalid.join(', ')}. Valid: ${VALID_SCOPES.join(', ')}`,
      );
    }
  }

  private requireAdminRole(roles: string[]): void {
    const hasAdmin = roles.some((r) =>
      [Role.SUPER_ADMIN, Role.TENANT_ADMIN].includes(r as never),
    );
    if (!hasAdmin) {
      throw new ForbiddenException('Only TENANT_ADMIN or SUPER_ADMIN may manage API keys');
    }
  }
}
