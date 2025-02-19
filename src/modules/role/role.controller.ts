import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleGuard } from 'src/common/guards/role-guard.guard';
import { Role } from 'src/common/decorators/role.decorator';

@UseGuards(RoleGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @HttpCode(200)
  @Role('super')
  @Get('all')
  getRoles(){
    return this.roleService.getRoles()
  }
}
