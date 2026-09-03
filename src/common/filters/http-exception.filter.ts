import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const SERVER_ERROR = 500;

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception.getResponse();
        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as Record<string, unknown>).message ||
                  'An error occurred';

        if (status >= SERVER_ERROR) {
            const cause: unknown = exception.cause;
            const detail =
                cause instanceof Error ? (cause.stack ?? cause.message) : cause;

            this.logger.error(
                `${request.method} ${request.url} -> ${status}: ${String(message)}`,
                detail ? String(detail) : exception.stack,
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            error: exception.name,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
