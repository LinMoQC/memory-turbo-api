import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CookieService } from 'src/utils/cookie-utils';

@Module({
  controllers: [UserController],
  providers: [UserService,PrismaService,CookieService]
})
export class UserModule {}
