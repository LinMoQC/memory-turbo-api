import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleGuard } from 'src/common/guards/role-guard.guard';

@UseGuards(RoleGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @HttpCode(200)
  @Get('all')
  getRoles(){
    return this.roleService.getRoles()
  }
}
