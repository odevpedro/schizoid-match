import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path: rawPath } = request;
    const requestId = uuid();
    const userId = request.user?.id || 'anonymous';
    const startTime = Date.now();

    request.requestId = requestId;

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          this.logger.log(JSON.stringify({
            requestId,
            method,
            path: rawPath,
            statusCode: response.statusCode,
            durationMs: duration,
            userId,
          }));
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;
          this.logger.error(JSON.stringify({
            requestId,
            method,
            path: rawPath,
            statusCode: error.status || 500,
            durationMs: duration,
            userId,
            errorCode: error.code || error.name || 'UNKNOWN',
          }));
        },
      }),
    );
  }
}
