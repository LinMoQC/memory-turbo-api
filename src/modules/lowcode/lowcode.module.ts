import { Module } from '@nestjs/common';
import { LowcodeService } from './lowcode.service';
import { LowcodeController } from './lowcode.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from 'src/common/gateway/notification.gateway';

@Module({
  controllers: [LowcodeController],
  providers: [LowcodeService,PrismaService,NotificationService,NotificationGateway]
})
export class LowcodeModule {}
