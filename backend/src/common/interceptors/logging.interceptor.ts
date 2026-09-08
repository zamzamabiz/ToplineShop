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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate or extract correlation ID
    const correlationId =
      (request.headers['x-correlation-id'] as string) || randomUUID();

    // Attach correlation ID to response headers
    response.setHeader('x-correlation-id', correlationId);

    const { method, url } = request;
    const userAgent = request.headers['user-agent'] || '';
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
              url,
              status: statusCode,
              duration: `${duration}ms`,
              correlationId,
              userAgent: this.sanitizeUserAgent(userAgent),
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.warn(
            JSON.stringify({
              type: 'request',
              method,
              url,
              status: statusCode,
              duration: `${duration}ms`,
              correlationId,
              error: error.message || 'Unknown error',
            }),
          );
        },
      }),
    );
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Truncate long user agents and remove potential sensitive info
    if (userAgent.length > 200) {
      return userAgent.substring(0, 200) + '...';
    }
    return userAgent;
  }
}
