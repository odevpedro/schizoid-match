import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse();

    const errorBody = typeof exceptionResponse === 'string'
      ? { message: exceptionResponse }
      : exceptionResponse as Record<string, unknown>;

    response.status(status).json({
      statusCode: status,
      error: errorBody['error'] ?? HttpStatus[status],
      message: errorBody['message'] ?? exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
