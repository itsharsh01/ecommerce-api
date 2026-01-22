import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data?.success !== undefined) {
          return data;
        }

        const hasMsg = typeof data?.msg === 'string';
        const hasData = 'data' in data;

        return {
          success: true,
          msg: hasMsg ? data.msg : 'Operation successful',
          ...(hasData ? { data: data.data } : {}),
        };
      }),
    );
  }
}
