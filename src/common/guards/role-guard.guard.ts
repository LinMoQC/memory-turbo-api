import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';  
import { JwtAuthGuard } from './jwt-auth-guard.guard';
import { Roles } from '@memory/shared';

/**
 * 权限路由守卫
 */
@Injectable()
export class RoleGuard extends JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    super();  
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string>('roles', context.getHandler());  

    if (!requiredRoles) {
      return true;  
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(Roles[user.role])) {
      throw new UnauthorizedException('权限不足');  
    }

    return true;  
  }
}
