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

/**
 * The point of this filter is that a 5xx leaves a readable trace, so an
 * unknown must never reach the log as '[object Object]'.
 */
const asText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (value === null || value === undefined) return '';
    if (value instanceof Error) return value.stack ?? value.message;
    if (Array.isArray(value)) return value.map(asText).join(', ');

    return JSON.stringify(value) ?? '';
};

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

        const exceptionResponse: unknown = exception.getResponse();
        const message: unknown =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : ((exceptionResponse as Record<string, unknown>).message ??
                  'An error occurred');

        if (status >= SERVER_ERROR) {
            const cause: unknown = exception.cause;
            const detail = asText(cause);

            this.logger.error(
                `${request.method} ${request.url} -> ${status}: ${asText(message)}`,
                detail || exception.stack,
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
