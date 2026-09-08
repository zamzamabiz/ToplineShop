import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const CORRELATION_ID_REGEX = /^[a-zA-Z0-9\-_]{1,64}$/;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Validate or generate correlation ID
    const rawCorrelationId = request.headers['x-correlation-id'] as string;
    const correlationId = this.sanitizeCorrelationId(rawCorrelationId);

    // Attach correlation ID to response headers
    response.setHeader('x-correlation-id', correlationId);

    const { method } = request;
    const path = this.getSafePath(request.url);
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            JSON.stringify({
              type: 'request',
              method,
              path,
              status: statusCode,
              duration: `${duration}ms`,
              correlationId,
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log only safe, non-sensitive error classification
          this.logger.warn(
            JSON.stringify({
              type: 'request',
              method,
              path,
              status: statusCode,
              duration: `${duration}ms`,
              correlationId,
              errorCode: this.getSafeErrorCode(statusCode),
            }),
          );
        },
      }),
    );
  }

  private getSafePath(url: string): string {
    // Extract pathname only, exclude query strings
    const queryIndex = url.indexOf('?');
    return queryIndex >= 0 ? url.substring(0, queryIndex) : url;
  }

  private sanitizeCorrelationId(raw: string | undefined): string {
    if (raw && CORRELATION_ID_REGEX.test(raw)) {
      return raw;
    }
    return randomUUID();
  }

  private getSafeErrorCode(statusCode: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      408: 'REQUEST_TIMEOUT',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[statusCode] || 'HTTP_ERROR';
  }
}
