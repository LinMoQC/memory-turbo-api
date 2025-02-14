import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import * as cookieParser from 'cookie-parser';
import { JwtAuthGuard } from './common/guards/jwt-auth-guard.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as dotenv from 'dotenv';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

// 加载 .env 文件
dotenv.config();

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 使用 cookie 解析器
  app.use(cookieParser());

  // 启用 CORS
  app.enableCors({
    origin: 'http://localhost:3000', // 根据需要调整
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 启用全局校验管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // 使用全局 JWT 验证守卫
  app.useGlobalGuards(new JwtAuthGuard());

  // 使用全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 使用全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 设置 WebSocket 适配器
  app.useWebSocketAdapter(new CustomIoAdapter(app));

  // 启动 HTTP 服务
  await app.listen(process.env.PORT ?? 5666);
}
bootstrap();
