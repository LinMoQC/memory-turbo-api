import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable} from 'rxjs';
import { map} from 'rxjs/operators';
import { SuccessResponse,Response } from 'src/shared/response-dto';

/**
 * 全局响应拦截器，用于统一包装所有成功响应。
 * @description 该拦截器会检查响应数据，如果响应是 `SuccessResponse` 类型则直接返回，
 * 否则会将响应包装在 `SuccessResponse` 中，保持一致的响应格式。
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof SuccessResponse) {
          return data;
        }

        return new SuccessResponse(data, 'Request successful');
      }),
    );
  }
}