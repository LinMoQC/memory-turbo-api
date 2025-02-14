import { SetMetadata } from '@nestjs/common';

// 角色装饰器，支持多个角色
export const Role = (...roles: string[]) => SetMetadata('roles', roles);
