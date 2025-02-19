import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { hash } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CookieService } from 'src/utils/cookie-utils';
import { Response } from 'express';
import { SuccessResponse } from 'src/shared/response-dto';
import { AdminInfo } from './dto/admin-info.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {

  constructor(private readonly prisma: PrismaService,private readonly cookieService: CookieService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...user } = createUserDto;
    const hashedPassword = await hash(password);
    return await this.prisma.users.create({
      data: {
        password: hashedPassword,
        ...user,
      },
    });
  }

  // 更新密码
  async updatePassword(email: string,password: string){
    const hashedPassword = await hash(password)
    return this.prisma.users.update({
      where: {email},
      data: {
        password: hashedPassword
      }
    })
  }

  async findByEmail(email: string){
    return await this.prisma.users.findUnique({
      where: { email },
    });
  } 

  async findByName(username: string){
    return await this.prisma.users.findUnique({
      where: { username },
    });
  }
  
  async info(username: string, res: Response) {
    try {
      const user = await this.findByName(username);
  
      if (!user || !user.status) {
        throw new UnauthorizedException("User Not Found")
      }
      this.cookieService.setRoleCookie(res, user.role_id, 30 * 60 * 1000, true);

      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role_id,
      };
      return res.send(new SuccessResponse(userInfo));
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new UnauthorizedException("User Not Found")
    }
  }

  async getAllAdmin(): Promise<AdminInfo[]> {
    return await this.prisma.users.findMany({
      where: {
        role_id: { in: [2, 3] }
      },
      select: {
        username: true,
        avatar: true,
        email: true
      }
    });
  }  

  async getUsers(){
    return this.prisma.users.findMany({
      select: {
        username: true,
        avatar: true,
        email: true,
        role_id: true,
        status: true,
        // last_login_at: true,
        created_at: true,
        updated_at: true
      }
    })
  }

  async update(username: string,updateDTO: UpdateUserDto,role: number){
    const target = await this.findByName(username)
    // 越权
    if(target.role_id > role) throw new BadRequestException('非法操作')
     try{
      const res = await this.prisma.users.update({
        where: {username},
        data: {
          username: updateDTO.username,
          avatar: updateDTO.avatar,
          email: updateDTO.email,
          role_id: updateDTO.role_id,
          status: updateDTO.status,
        }
      })
      if(res) return {msg: '更新成功'}
     }catch(err){
      return {msg: '更新失败'}
     }
  }

  async delete(username: string){
    return this.prisma.users.delete({
      where: {username}
    })
  }

  async super(createUserDto: CreateUserDto){
    const { password, ...user } = createUserDto;
    const hashedPassword = await hash(password);
    return await this.prisma.users.create({
      data: {
        password: hashedPassword,
        roles: {
          connect: { id: 3 }
        },
        ...user,
      },
    });
  }
}
