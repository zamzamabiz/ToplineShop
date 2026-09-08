import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../api-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ApiErrorResponse = {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        // Handle validation errors from our CustomValidationPipe
        if (responseObj.error?.code === 'VALIDATION_ERROR') {
          errorResponse = responseObj;
        }
        // Handle NestJS built-in validation errors
        else if (Array.isArray(responseObj.message)) {
          errorResponse = {
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: responseObj.message.map((msg: string) => ({
                field: 'unknown',
                message: msg,
              })),
            },
          };
        }
        // Handle known HTTP exceptions
        else if (responseObj.message) {
          errorResponse = {
            ok: false,
            error: {
              code: this.getErrorCode(status),
              message: responseObj.message,
            },
          };
        }
      } else if (typeof exceptionResponse === 'string') {
        errorResponse = {
          ok: false,
          error: {
            code: this.getErrorCode(status),
            message: exceptionResponse,
          },
        };
      }
    } else if (exception instanceof Error) {
      // Log only the error classification, not the message or stack
      this.logger.error(`Unexpected error: ${this.getErrorCode(500)}`);

      errorResponse = {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      };
    }

    // Log the request with safe error code only
    this.logger.warn(
      JSON.stringify({
        type: 'error',
        method: request.method,
        url: request.url,
        status,
        errorCode: errorResponse.error.code,
      }),
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
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

    return codeMap[status] || 'HTTP_ERROR';
  }
}
