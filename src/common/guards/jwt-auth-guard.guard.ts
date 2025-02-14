import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyAccessToken } from 'src/utils/jwt-utils';

/**
 * JWT校验守卫
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 判断请求路径是否是 auth 相关的接口，如果是则跳过认证
    const path = request.url;
    if (path.startsWith('/api/auth')) {
      return true; // 跳过认证
    }

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const user = await verifyAccessToken(token);
      request.user = user;
      return true; 
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

