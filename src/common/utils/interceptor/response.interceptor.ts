import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f76c088d-93b2-4f2d-bf6d-55e734fc4ef6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'response.interceptor.ts:10',message:'ResponseInterceptor data received',data:{dataType:typeof data,isObject:data !== null && typeof data === 'object',dataValue:typeof data === 'string' ? data.substring(0,50) : data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (data?.success !== undefined) {
          return data;
        }

        // Check if data is an object before using 'in' operator
        const isObject = data !== null && typeof data === 'object' && !Array.isArray(data);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f76c088d-93b2-4f2d-bf6d-55e734fc4ef6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'response.interceptor.ts:18',message:'Type check result',data:{isObject,dataType:typeof data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        const hasMsg = isObject && typeof data?.msg === 'string';
        const hasData = isObject && 'data' in data;

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f76c088d-93b2-4f2d-bf6d-55e734fc4ef6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'response.interceptor.ts:23',message:'Final response construction',data:{hasMsg,hasData,willWrap:!isObject},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // If data is a primitive (string, number, boolean), wrap it
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
