import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, originalUrl, ip } = request;
    const startTime = Date.now();

    // Log request start
    const logMessage = `→ ${method} ${originalUrl} - IP: ${ip}`;
    this.logger.log(logMessage);

    return next.handle().pipe(
      tap(() => {
        const timeTaken = Date.now() - startTime;
        const statusCode = response.statusCode;

        const successMessage = `✓ ${method} ${originalUrl} ${statusCode} - ${timeTaken}ms`;
        this.logger.log(successMessage);
      }),
      catchError((error) => {
        const timeTaken = Date.now() - startTime;
        const statusCode = error?.status || response.statusCode || 500;

        const errorMessage = `✗ ${method} ${originalUrl} ${statusCode} - ${timeTaken}ms - ${error?.message || 'Unknown error'}`;
        this.logger.error(errorMessage);

        return throwError(() => error);
      }),
    );
  }
}
