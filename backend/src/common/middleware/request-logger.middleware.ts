import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestWithId } from './correlation-id.middleware';
import { MetricsService, StatusClass } from '../metrics/metrics.service';

/**
 * RequestLoggerMiddleware
 *
 * Structured request logging. Logs ONLY:
 *   method, path template (best-effort), statusCode, durationMs, requestId, tenantId
 *
 * NEVER logs:
 *   Authorization, Cookie, request body, uploaded file contents,
 *   passwords, secrets, JWT tokens, raw trade records.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startMs = Date.now();
    const method = req.method;
    const url = req.originalUrl ?? req.url ?? '';

    // Tenant from JWT payload if already decoded — never from raw header
    const user = (req as unknown as Record<string, unknown>)['user'] as Record<string, unknown> | undefined;
    const tenantId = (user?.['tenantId'] as string | undefined) ?? undefined;
    const requestId = (req as RequestWithId).requestId ?? '—';

    res.on('finish', () => {
      const durationMs = Date.now() - startMs;
      const statusCode = res.statusCode;
      const statusClass = classifyStatus(statusCode);

      this.logger.log({
        event: 'http_request',
        method,
        path: sanitizePath(url),
        statusCode,
        durationMs,
        requestId,
        ...(tenantId ? { tenantId } : {}),
      });

      this.metrics.recordHttpRequest(method, statusClass, durationMs);
    });

    next();
  }
}

function classifyStatus(code: number): StatusClass {
  if (code >= 200 && code < 300) return '2xx';
  if (code >= 300 && code < 400) return '3xx';
  if (code >= 400 && code < 500) return '4xx';
  if (code >= 500) return '5xx';
  return 'other';
}

/**
 * Sanitize URL path for logging.
 * - Strips query string to avoid logging sensitive query params.
 * - Caps length to 256 chars.
 */
function sanitizePath(url: string): string {
  const questionMark = url.indexOf('?');
  const path = questionMark >= 0 ? url.slice(0, questionMark) : url;
  return path.slice(0, 256);
}
