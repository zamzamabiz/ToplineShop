import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHmac, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { Role } from '../../auth/types/role.type';
import { success } from '../../common/api-response';
import { decryptWebhookSecret, encryptWebhookSecret } from './webhook-secret.util';

export const VALID_EVENT_TYPES = [
  'source.uploaded',
  'source.replaced',
  'source.archived',
  'source.restored',
  'batch.completed',
  'batch.failed',
  'export.completed',
  'export.failed',
] as const;

export type TdrEventType = (typeof VALID_EVENT_TYPES)[number];

export interface TdrWebhookEvent {
  eventType: TdrEventType;
  tenantId: string;
  payload: Record<string, unknown>;
}

const MAX_ATTEMPTS = 3;
const RETRY_INTERVAL_MS = 30_000; // poll every 30s
const BACKOFF_BASE_MS = 5_000;

// SSRF protection: reject private/loopback/link-local destinations in production
const BLOCKED_HOSTS_RE =
  /^(localhost|127\.|0\.0\.0\.0|::1|169\.254\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

@Injectable()
export class TdrWebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TdrWebhookService.name);
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    const encKey = process.env['TDR_WEBHOOK_SECRET_ENCRYPTION_KEY'];
    if (!encKey && process.env['NODE_ENV'] === 'production') {
      throw new Error(
        'FATAL: TDR_WEBHOOK_SECRET_ENCRYPTION_KEY must be set in production ' +
        '(64 hex chars / 32 bytes for AES-256-GCM).',
      );
    }
    if (!encKey) {
      this.logger.warn(
        'TDR_WEBHOOK_SECRET_ENCRYPTION_KEY is not set — webhook signing secrets ' +
        'will be stored as plaintext. Set this variable before deploying to production.',
      );
    }
    this.retryTimer = setInterval(() => {
      void this.processRetries().catch((err) =>
        this.logger.error('Webhook retry loop error', err),
      );
    }, RETRY_INTERVAL_MS);
    // Unref so the interval does not prevent process exit in test environments.
    this.retryTimer.unref();
  }

  onModuleDestroy() {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  async subscribe(
    url: string,
    eventTypes: string[],
    user: AuthenticatedUser,
  ) {
    this.requireAdminRole(user.roles);
    this.validateEventTypes(eventTypes);
    this.validateUrl(url);

    const signingSecret = randomBytes(32).toString('hex');
    const encKey = process.env['TDR_WEBHOOK_SECRET_ENCRYPTION_KEY'];
    const storedSecret = encKey
      ? encryptWebhookSecret(signingSecret, encKey)
      : signingSecret;

    const sub = await this.prisma.tdrWebhookSubscription.create({
      data: {
        tenantId: user.tenantId,
        url,
        eventTypes,
        signingSecret: storedSecret,
        enabled: true,
      },
    });

    await this.audit.recordEvent({
      action: 'tdr.webhook.subscribed',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrWebhookSubscription',
      entityId: sub.id,
      metadata: { url, eventTypes },
    });

    return success({
      id: sub.id,
      url: sub.url,
      eventTypes: sub.eventTypes,
      enabled: sub.enabled,
      // Return signing secret once on creation
      signingSecret,
      createdAt: sub.createdAt,
    });
  }

  async unsubscribe(subscriptionId: string, user: AuthenticatedUser) {
    this.requireAdminRole(user.roles);

    const sub = await this.prisma.tdrWebhookSubscription.findFirst({
      where: { id: subscriptionId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!sub) throw new NotFoundException(`Webhook subscription ${subscriptionId} not found`);

    await this.prisma.tdrWebhookSubscription.update({
      where: { id: subscriptionId },
      data: { enabled: false },
    });

    await this.audit.recordEvent({
      action: 'tdr.webhook.unsubscribed',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrWebhookSubscription',
      entityId: subscriptionId,
      metadata: {},
    });

    return success({ id: subscriptionId, enabled: false });
  }

  async listSubscriptions(user: AuthenticatedUser) {
    const subs = await this.prisma.tdrWebhookSubscription.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true,
        url: true,
        eventTypes: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(subs);
  }

  /** Enqueue and attempt immediate first delivery for an event. */
  async dispatchEvent(event: TdrWebhookEvent): Promise<void> {
    const subs = await this.prisma.tdrWebhookSubscription.findMany({
      where: {
        tenantId: event.tenantId,
        enabled: true,
        eventTypes: { has: event.eventType },
      },
      select: { id: true, url: true, signingSecret: true },
    });

    const encKey = process.env['TDR_WEBHOOK_SECRET_ENCRYPTION_KEY'];
    for (const sub of subs) {
      const eventId = randomUUID();
      const attempt = await this.prisma.tdrWebhookDeliveryAttempt.create({
        data: {
          subscriptionId: sub.id,
          tenantId: event.tenantId,
          eventType: event.eventType,
          eventId,
          payload: { eventType: event.eventType, eventId, tenantId: event.tenantId, ...event.payload },
          attemptNumber: 1,
          maxAttempts: MAX_ATTEMPTS,
          status: 'PENDING',
        },
      });

      const plainSecret = encKey
        ? decryptWebhookSecret(sub.signingSecret, encKey)
        : sub.signingSecret;

      // Attempt immediate delivery
      await this.attemptDelivery(attempt.id, sub.url, plainSecret, attempt.payload as Record<string, unknown>);
    }
  }

  private async attemptDelivery(
    attemptId: string,
    url: string,
    signingSecret: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = createHmac('sha256', signingSecret)
      .update(`${ts}.${body}`)
      .digest('hex');

    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TDR-Timestamp': ts,
          'X-TDR-Signature': `sha256=${sig}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = res.status;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const delivered = statusCode !== null && statusCode >= 200 && statusCode < 300;
    const current = await this.prisma.tdrWebhookDeliveryAttempt.findUnique({
      where: { id: attemptId },
      select: { attemptNumber: true, maxAttempts: true },
    });
    if (!current) return;

    const exhausted = !delivered && current.attemptNumber >= current.maxAttempts;

    await this.prisma.tdrWebhookDeliveryAttempt.update({
      where: { id: attemptId },
      data: {
        status: delivered ? 'DELIVERED' : exhausted ? 'EXHAUSTED' : 'FAILED',
        statusCode,
        errorMessage,
        deliveredAt: delivered ? new Date() : null,
        nextRetryAt:
          !delivered && !exhausted
            ? new Date(Date.now() + BACKOFF_BASE_MS * Math.pow(2, current.attemptNumber - 1))
            : null,
        updatedAt: new Date(),
      },
    });
  }

  private async processRetries(): Promise<void> {
    const due = await this.prisma.tdrWebhookDeliveryAttempt.findMany({
      where: {
        status: 'FAILED',
        nextRetryAt: { lte: new Date() },
      },
      select: { id: true, subscriptionId: true, payload: true, attemptNumber: true },
      take: 50,
    });

    for (const attempt of due) {
      const sub = await this.prisma.tdrWebhookSubscription.findUnique({
        where: { id: attempt.subscriptionId },
        select: { url: true, signingSecret: true, enabled: true },
      });
      if (!sub || !sub.enabled) {
        await this.prisma.tdrWebhookDeliveryAttempt.update({
          where: { id: attempt.id },
          data: { status: 'EXHAUSTED', nextRetryAt: null },
        });
        continue;
      }

      // Increment attempt count
      await this.prisma.tdrWebhookDeliveryAttempt.update({
        where: { id: attempt.id },
        data: { attemptNumber: attempt.attemptNumber + 1 },
      });

      const encKey = process.env['TDR_WEBHOOK_SECRET_ENCRYPTION_KEY'];
      const plainSecret = encKey
        ? decryptWebhookSecret(sub.signingSecret, encKey)
        : sub.signingSecret;

      await this.attemptDelivery(
        attempt.id,
        sub.url,
        plainSecret,
        attempt.payload as Record<string, unknown>,
      );
    }
  }

  private validateEventTypes(eventTypes: string[]): void {
    const invalid = eventTypes.filter(
      (e) => !(VALID_EVENT_TYPES as readonly string[]).includes(e),
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid event types: ${invalid.join(', ')}. Valid: ${VALID_EVENT_TYPES.join(', ')}`,
      );
    }
  }

  private validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }
    if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Webhook URL must use HTTPS in production');
    }
    if (BLOCKED_HOSTS_RE.test(parsed.hostname)) {
      throw new BadRequestException('Webhook URL points to a blocked/private destination');
    }
  }

  private requireAdminRole(roles: string[]): void {
    if (!roles.some((r) => [Role.SUPER_ADMIN, Role.TENANT_ADMIN].includes(r as never))) {
      throw new ForbiddenException('Only admins may manage webhook subscriptions');
    }
  }
}
