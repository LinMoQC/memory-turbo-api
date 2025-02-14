import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/modules/user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CookieService } from 'src/utils/cookie-utils';
import { MailService } from '../mail/mail.service';
import { GithubStrategy } from '../oauth/github/github.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService, PrismaService,CookieService,MailService,GithubStrategy],
})
export class AuthModule {}
