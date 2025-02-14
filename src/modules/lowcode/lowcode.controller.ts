import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Put, UseGuards, Query, Req } from '@nestjs/common';
import { LowcodeService } from './lowcode.service';
import { CreateLowcodeDto } from './dto/create-lowcode.dto';
import { UpdateLowcodeDto } from './dto/update-lowcode.dto';
import { RoleGuard } from 'src/common/guards/role-guard.guard';
import { Role } from 'src/common/decorators/role.decorator';
import { ApproveDTO } from './dto/approve.dto';

@UseGuards(RoleGuard)
@Controller('lowcode')
export class LowcodeController {
  constructor(private readonly lowcodeService: LowcodeService) {}

  @HttpCode(201)
  @Post('save')
  save(@Body() template: CreateLowcodeDto){
    return this.lowcodeService.create(template)
  }

  @HttpCode(200)
  @Role('admin')
  @Post('pendings')
  getPendings(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.lowcodeService.findAllPendings(page, pageSize);
  }

  @HttpCode(200)
  @Post('request-approval')
  review(@Body() approveDTO: ApproveDTO){
    return this.lowcodeService.requestApproval(approveDTO)
  }

  @HttpCode(200)
  @Role('admin')
  @Post('approve-request') // 批准请求
  approveRequest(@Body('templateKey') templateKey: string) {
    return this.lowcodeService.approveRequest(templateKey);
  }

  @HttpCode(200)
  @Role('admin')
  @Post('reject-request') // 拒绝请求
  rejectRequest(@Body('templateKey') templateKey: string) {
    return this.lowcodeService.rejectRequest(templateKey);
  }

  @HttpCode(200)
  @Get('all')
  findAll(@Req() req){
    const user = req.user
    return this.lowcodeService.findAll(user.username,user.role_id)
  }

  @HttpCode(200)
  @Delete('delete/:key')
  deleteByTemplateKey(@Param('key') key: string){
    return this.lowcodeService.deleteByTemplateKey(key)
  }

  @HttpCode(200)
  @Get(':key')
  getByTemplateKey(@Param('key') key: string){
    return this.lowcodeService.findByTemplateKey(key)
  }

  @HttpCode(200)
  @Patch(':key')
  updateByTemplateKey(@Param('key') key: string,@Body() template: UpdateLowcodeDto){
    return this.lowcodeService.updateByTemplateKey(key,template)
  }
}
