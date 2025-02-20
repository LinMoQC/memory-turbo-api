import { Module } from '@nestjs/common';
import { LowcodeService } from './lowcode.service';
import { LowcodeController } from './lowcode.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from 'src/common/gateway/notification.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [LowcodeController],
  providers: [LowcodeService,PrismaService,NotificationService,NotificationGateway]
})
export class LowcodeModule {}
