import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateLowcodeDto } from './dto/create-lowcode.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLowcodeDto } from './dto/update-lowcode.dto';
import { v4 as uuidv4 } from 'uuid';
import { ApproveDTO } from './dto/approve.dto';
import { templateStatusEnum } from '@memory/shared';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from 'src/common/gateway/notification.gateway';
import { Roles } from '@memory/shared';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LowcodeTemplateDTO } from 'src/shared/lowcode-dto';

@Injectable()
export class LowcodeService {

  constructor(private readonly prisma: PrismaService,private readonly notificationService: NotificationService,private readonly notification: NotificationGateway,@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async create(createLowcodeDto: CreateLowcodeDto) {
    const { template_name, template_json, username } = createLowcodeDto

    const isExist = await this.prisma.lowcode_templates.findFirst({
      where: { template_name },
    });

    if (isExist) {
      throw new ConflictException('模版已存在');
    }

    const templateKey = uuidv4();

    const newProject = await this.prisma.lowcode_templates.create({
      data: {
        template_name,
        template_json,
        username,
        template_key: `memory_flow_${templateKey}`
      },
    });

    return newProject
  }

  async findAll(username: string,role: number) {
    // 管理员可以看到所有的模版
    if(role >= Roles.admin){
      return this.prisma.lowcode_templates.findMany()
    }else{
      // 非管理只能看自己创建的
      return this.prisma.lowcode_templates.findMany({
        where: {
          username
        }
      })
    }
  }

  async deleteByTemplateKey(key: string): Promise<LowcodeTemplateDTO> {
    return this.prisma.lowcode_templates.delete({
      where: { template_key: key }
    })
  }

  async findByTemplateKey(key: string): Promise<LowcodeTemplateDTO> {
    const cacheKey = `lowcode:template:${key}`;
    let template = await this.cacheManager.get<LowcodeTemplateDTO>(cacheKey);

    if (!template) {
      template = await this.prisma.lowcode_templates.findUnique({
        where: { template_key: key },
      });
      if (template) {
        await this.cacheManager.set<LowcodeTemplateDTO>(cacheKey, template, 6000);  // 缓存 1分钟
      }
    }

    return template;
  }

  async updateByTemplateKey(key: string, template: UpdateLowcodeDto | null = null, status?: templateStatusEnum) {
    try {
      const updatedTemplate = await this.prisma.lowcode_templates.update({
        where: { template_key: key },
        data: template ? template : { status },
      });

      // 更新模板缓存
      await this.cacheManager.set(`lowcode:template:${key}`, updatedTemplate, 60000);

      return {
        msg: '模版更新成功'
      };
    } catch (error) {
      throw new ConflictException('模版更新失败');
    }
  }

  async findAllPendings(page: number = 1, pageSize: number = 5) {
    const [templates, total] = await Promise.all([
      this.prisma.lowcode_templates.findMany({
        where: { status: 'pending' },
        include: {
          users: {
            select: { email: true, avatar: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updated_at: 'desc' }, 
      }),
      this.prisma.lowcode_templates.count({ where: { status: 'pending' } }),
    ]);
  
    const hasNext = (page * pageSize) < total;
  
    return {
      templates: templates.map(template => {
        const { users, ...rest } = template;
        return { ...rest, user: users };
      }),
      hasNext,
    };
  }
  
  

  async requestApproval(approveDTO: ApproveDTO) {
    const { template_key, approver } = approveDTO;
  
    // 并行更新状态和查找模板 ID
    const [_, template] = await Promise.all([
      this.updateByTemplateKey(template_key, null, templateStatusEnum.PENDING),
      this.findByTemplateKey(template_key)
    ]);
  
    // 新建通知消息
    await this.notificationService.create(template.id, approver);
    this.notification.sendToAdmin(approver,'您有待审批的模版')
    return '流转成功'
  }  

  async approveRequest(template_key: string) {
    // 并行更新状态和查找模板 ID
    const [_, template] = await Promise.all([
      this.updateByTemplateKey(template_key, null, templateStatusEnum.APPROVED),
      this.findByTemplateKey(template_key)
    ]);

    // 更新通知消息状态
    await this.notificationService.update(template.id);
    this.notification.sendToPublic(template.username,'审批状态已更新')
    return '流转成功'
  }

  async rejectRequest(template_key: string) {
    // 并行更新状态和查找模板 ID
    const [_, template] = await Promise.all([
      this.updateByTemplateKey(template_key, null, templateStatusEnum.REJECTED),
      this.findByTemplateKey(template_key)
    ]);

    // 更新通知消息状态
    await this.notificationService.update(template.id);
    this.notification.sendToPublic(template.username,'审批状态已更新')
    return '流转成功'
  }
}
