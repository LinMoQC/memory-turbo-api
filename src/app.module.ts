import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { LowcodeModule } from './modules/lowcode/lowcode.module';
import { NotificationGateway } from './common/gateway/notification.gateway';
import { NotificationService } from './modules/notification/notification.service';
import { NotificationModule } from './modules/notification/notification.module';
import { RoleModule } from './modules/role/role.module';
import { MailService } from './modules/mail/mail.service';
import { GithubService } from './modules/oauth/github/github.service';
import { JwtAuthMiddleware } from './common/middlewares/jwt.middleware';



@Module({
  imports: [AuthModule, UserModule, LowcodeModule, NotificationModule, RoleModule],
  controllers: [AppController],
  providers: [AppService, PrismaService,NotificationGateway, NotificationService, MailService, GithubService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtAuthMiddleware)
      // 排除auth
      .exclude({ path: '/auth/(.*)', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
