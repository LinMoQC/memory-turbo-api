import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from 'src/constant/notification';

@Injectable()
export class NotificationService {
    constructor(private readonly prisma: PrismaService) { }

    async create(taskId: number, username: string) {
        try {
          // 创建通知
          // 通知指定管理审批
          return this.prisma.notifications.create({
            data: {
              username: username,             // 任务更新的目标用户
              type_id: NotificationType.template_approve, 
              target_id: taskId,
              message: '模版更新请求', 
              status: 'unread',            // 初始状态为未读
            },
          });
        } catch (error) {
          console.error('Error creating notification:', error);
          throw new Error('Failed to create notification');
        }
      }
      
      async update(taskId: number) {
        try {
          return this.prisma.notifications.updateMany({
            where: {target_id: taskId},
            data: {
              status: 'read'
            }
          });
        } catch (error) {
          console.error('Error updating notification:', error);
          throw new Error('Failed to updating notification');
        }
      }      
}
