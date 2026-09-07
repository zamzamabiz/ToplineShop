export interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  tenantId?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'DATABASE_URL',
  'authorization',
];

export function sanitizeMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lower.includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
