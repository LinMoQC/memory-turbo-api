import { Controller, Get, Body, HttpCode, Req, Res, UseGuards, Post, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
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
  @Role('admin', 'super')
  @Post(':name')
  update(@Param('name') name: string,@Body() updateDTO: UpdateUserDto,@Req() request: Request){
    const user = request.user
    return this.userService.update(name,updateDTO,user.role)
  }

  @HttpCode(200)
  @Role('admin', 'super')
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
  @Role('admin', 'super')
  @Get('all')
  getUsers(){
    return this.userService.getUsers()
  }
}
