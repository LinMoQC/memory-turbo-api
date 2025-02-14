import { Controller, Get, Body, HttpCode, Req, Res, UseGuards, Post, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { RoleGuard } from 'src/common/guards/role-guard.guard';
import { Role } from 'src/common/decorators/role.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(RoleGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @HttpCode(200)
  @Get('info')
  info(@Req() req ,@Res() res: Response) {
    const user = req.user
    return this.userService.info(user.username,res)
  }

  @HttpCode(200)
  @Role('admin')
  @Post(':name')
  update(@Param('name') name: string,@Body() updateDTO: UpdateUserDto){
    return this.userService.update(name,updateDTO)
  }

  @HttpCode(200)
  @Role('admin')
  @Delete(':name')
  delete(@Param('name') name: string){
    return this.userService.delete(name)
  }

  @HttpCode(200)
  @Get('admin')
  admin(){
    return this.userService.getAllAdmin()
  }

  @HttpCode(200)
  @Role('admin')
  @Get('all')
  getUsers(){
    return this.userService.getUsers()
  }
}
