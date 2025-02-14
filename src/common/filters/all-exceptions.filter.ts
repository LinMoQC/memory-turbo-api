import { ExceptionFilter, Catch, ArgumentsHost, HttpException} from '@nestjs/common';
import { Response } from 'express';
import { FailResponse } from 'src/shared/response-dto';

/**
 * 全局异常过滤器，用于捕获并格式化所有 HTTP 异常。
 * @description 该过滤器会捕获所有类型的 HttpException，并返回统一格式的错误响应。
 */
@Catch(HttpException)  
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.getResponse();

    response.status(status).json(new FailResponse(
      typeof message === 'string' ? message : message['message'],
      message instanceof Object ? message['message'] : message,
    ));
  }
}
