import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from 'src/common/gateway/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [NotificationService, NotificationGateway,PrismaService], 
})
export class NotificationModule {}
