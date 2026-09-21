/**
 * Central environment validation.
 * Called at startup in main.ts before NestFactory.create().
 * In production: missing or weak secrets → fatal startup error.
 * In development/test: dev defaults are allowed.
 */

const KNOWN_WEAK_SECRETS = new Set([
  'CHANGE_ME_DEV_ONLY',
  'changeme',
  'secret',
  'password',
  '123456',
  '',
]);

export interface ValidatedEnv {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  corsOrigins: string[];
  cookieSecure: boolean;
}

export function validateEnv(): ValidatedEnv {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const isProduction = nodeEnv === 'production';

  // ── JWT secrets ────────────────────────────────────────────────────────────
  const accessSecret = process.env['JWT_ACCESS_SECRET'];
  const refreshSecret = process.env['JWT_REFRESH_SECRET'];

  if (isProduction) {
    if (!accessSecret || KNOWN_WEAK_SECRETS.has(accessSecret)) {
      throw new Error(
        'FATAL: JWT_ACCESS_SECRET is missing or uses a known weak placeholder. ' +
        'Set a strong random secret before starting in production.',
      );
    }
    if (!refreshSecret || KNOWN_WEAK_SECRETS.has(refreshSecret)) {
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET is missing or uses a known weak placeholder. ' +
        'Set a strong random secret before starting in production.',
      );
    }
    if (!process.env['DATABASE_URL']) {
      throw new Error('FATAL: DATABASE_URL is required in production.');
    }
  }

  // ── CORS origins ──────────────────────────────────────────────────────────
  const corsOrigins = process.env['CORS_ALLOWED_ORIGINS']
    ? process.env['CORS_ALLOWED_ORIGINS'].split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:3000'];

  if (isProduction && corsOrigins.length === 0) {
    throw new Error('FATAL: CORS_ALLOWED_ORIGINS must be set in production.');
  }

  if (isProduction) {
    const hasWildcard = corsOrigins.includes('*');
    if (hasWildcard) {
      throw new Error('FATAL: CORS_ALLOWED_ORIGINS must not contain wildcard (*) in production.');
    }
  }

  // ── PORT ──────────────────────────────────────────────────────────────────
  const portStr = process.env['PORT'] ?? '4000';
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`FATAL: PORT "${portStr}" is not a valid port number.`);
  }

  // ── Cookie security ───────────────────────────────────────────────────────
  const cookieSecure =
    isProduction || process.env['COOKIE_SECURE'] === 'true';

  return {
    nodeEnv,
    isProduction,
    port,
    jwtAccessSecret: accessSecret ?? 'CHANGE_ME_DEV_ONLY',
    jwtRefreshSecret: refreshSecret ?? 'CHANGE_ME_DEV_ONLY',
    corsOrigins,
    cookieSecure,
  };
}
