import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { hash } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CookieService } from 'src/utils/cookie-utils';
import { Response } from 'express';
import { SuccessResponse } from 'src/shared/response-dto';
import { AdminInfo } from './dto/admin-info.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserDTO } from 'src/shared/user-dto';

@Injectable()
export class UserService {

  constructor(private readonly prisma: PrismaService,private readonly cookieService: CookieService,@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // 创建用户
  async create(createUserDto: CreateUserDto) {
    const { password, ...user } = createUserDto;
    const hashedPassword = await hash(password);
    const newUser = await this.prisma.users.create({
      data: {
        password: hashedPassword,
        ...user,
      },
    });
    // 缓存新创建的用户数据
    await this.cacheManager.set(`user:email:${newUser.email}`, newUser, 60);
    await this.cacheManager.set(`user:username:${newUser.username}`, newUser, 60);
    return newUser;
  }

  // 更新密码
  async updatePassword(email: string,password: string){
    const hashedPassword = await hash(password);
    const updatedUser = await this.prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });
    // 清除缓存
    await this.cacheManager.del(`user:email:${email}`);
    if (updatedUser.username) {
      await this.cacheManager.del(`user:username:${updatedUser.username}`);
    }
    return updatedUser;
  }

  // 邮箱查找
  async findByEmail(email: string): Promise<UserDTO>{
    const key = `user:email:${email}`;
    let user = await this.cacheManager.get<UserDTO>(key);
    if (user) return user;
    user = await this.prisma.users.findUnique({ where: { email } });
    if (user) await this.cacheManager.set(key, user, 60);
    return user;
  } 

  // 用户名查找
  async findByName(username: string): Promise<UserDTO>{
    const key = `user:username:${username}`;
    let user = await this.cacheManager.get<UserDTO>(key);
    if (user) return user;
    user = await this.prisma.users.findUnique({ where: { username } });
    if (user) await this.cacheManager.set<UserDTO>(key, user,60000);
    return user;
  }
  
  // 用户信息
  async info(username: string, res: Response) {
    try {
      const user = await this.findByName(username);
  
      if (!user || !user.status) {
        throw new UnauthorizedException("User Not Found")
      }
      this.cookieService.setRoleCookie(res, user.role, 30 * 60 * 1000, true);
      const {password,last_login_at,updated_at,created_at,...userInfo} = user
      return res.send(new SuccessResponse(userInfo));
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new UnauthorizedException("User Not Found")
    }
  }

  // 所有的管理（admin super）
  async getAllAdmin(): Promise<AdminInfo[]> {
    const key = 'users:admins';
    let admins = await this.cacheManager.get<AdminInfo[]>(key);
    if (admins) return admins 

    admins = await this.prisma.users.findMany({
      where: { role: { in: [2, 3] } },
      select: {
        username: true,
        avatar: true,
        email: true,
      },
    });
    await this.cacheManager.set<AdminInfo[]>(key, admins, 6000);
    return admins;
  }  

  // 所有用户
  async getUsers(): Promise<UserDTO[]>{
    const key = 'users:all';
    let users = await this.cacheManager.get<UserDTO[]>(key);
    if (users) return users;

    users = await this.prisma.users.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
    await this.cacheManager.set<UserDTO[]>(key, users, 6000);
    return users;
  }

  // 更新用户
  async update(username: string,updateDTO: UpdateUserDto,role: number){
    const target = await this.findByName(username);
    // 越权判断
    if (target.role > role) throw new BadRequestException('非法操作');

    try {
      const resUser = await this.prisma.users.update({
        where: { username },
        data: {
          username: updateDTO.username,
          avatar: updateDTO.avatar,
          email: updateDTO.email,
          role: updateDTO.role,
          status: updateDTO.status,
        },
      });
      // 清除旧缓存
      await this.cacheManager.del(`user:username:${username}`);
      await this.cacheManager.del(`user:email:${target.email}`);
      // 更新缓存数据
      await this.cacheManager.set(`user:username:${resUser.username}`, resUser, 60000);
      await this.cacheManager.set(`user:email:${resUser.email}`, resUser, 60000);
      return { msg: '更新成功' };
    } catch (err) {
      return { msg: '更新失败' };
    }
  }

  // 删除用户
  async delete(username: string){
    const target = await this.findByName(username);
    if (target) {
      await this.cacheManager.del(`user:username:${username}`);
      await this.cacheManager.del(`user:email:${target.email}`);
    }
    return this.prisma.users.delete({
      where: { username },
    });
  }

  // 初始化一个超管
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
