import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * CorrelationIdMiddleware
 *
 * 1. Reads inbound X-Request-ID header.
 * 2. Validates it: max 128 chars, printable ASCII only (no control chars, no CR/LF).
 *    An invalid or absent inbound value is replaced with a new UUID.
 * 3. Attaches the resolved ID to req.requestId (Express augment).
 * 4. Returns it in the X-Request-ID response header.
 *
 * Security: malformed inbound values are discarded to prevent header injection.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private static readonly MAX_LEN = 128;
  private static readonly SAFE_PATTERN = /^[\x20-\x7E]{1,128}$/;

  use(req: Request, res: Response, next: NextFunction): void {
    const inbound = req.headers[REQUEST_ID_HEADER];
    const raw = Array.isArray(inbound) ? inbound[0] : inbound;

    const requestId =
      raw &&
      raw.length <= CorrelationIdMiddleware.MAX_LEN &&
      CorrelationIdMiddleware.SAFE_PATTERN.test(raw)
        ? raw
        : randomUUID();

    (req as RequestWithId).requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}

/** Express request augmented with requestId. */
export interface RequestWithId extends Request {
  requestId: string;
}
