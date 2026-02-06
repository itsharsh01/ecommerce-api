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

        const isObject = data !== null && typeof data === 'object' && !Array.isArray(data);
        const hasMsg = isObject && typeof data?.msg === 'string';
        const hasData = isObject && 'data' in data;

        if (!isObject) {
          return {
            success: true,
            msg: 'Operation successful',
            data: data,
          };
        }

        return {
          success: true,
          msg: hasMsg ? data.msg : 'Operation successful',
          ...(hasData ? { data: data.data } : {}),
        };
      }),
    );
  }
}
