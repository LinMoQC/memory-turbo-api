import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDTO } from './dto/login-auth.dto';
import { verify } from 'argon2';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from 'src/utils/jwt-utils';
import { UserDTO } from 'src/shared/user-dto';
import { CookieService } from 'src/utils/cookie-utils';
import { Request, Response } from 'express';
import { UserStatusEnum } from '@memory/shared';
import { MailService } from '../mail/mail.service';
import { createCache, Cache } from 'cache-manager';
import Keyv from 'keyv';
import { ForgetDTO } from './dto/forget-auth.dto';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class AuthService {
  private cache: Cache;
  constructor(private readonly userService: UserService, private readonly cookieService: CookieService, private readonly mailService: MailService) {
    this.cache = createCache({
      stores: [new Keyv()],
      ttl: 60 * 1000,
    });
  }

  // 登录接口
  async Login(loginDto: LoginDTO, response: Response): Promise<{ userInfo: UserDTO, accessToken: string }> {
    const user = await this.userService.findByEmail(loginDto.email)
    if (!user) throw new HttpException('用户不存在', HttpStatus.FORBIDDEN);

    if (user.status === UserStatusEnum.DISABLED) throw new ForbiddenException('用户已被封禁，请联系管理员！');

    const isPasswordMatched = await verify(user.password, loginDto.password);
    if (!isPasswordMatched)
      throw new ForbiddenException('密码错误');
    else {
      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: loginDto.password,
        avatar: user.avatar,
        role: user.role_id,
        status: user.status
      }

      const accessToken = generateAccessToken(userInfo)
      const refreshToen = generateRefreshToken(userInfo)

      this.cookieService.setTokenCookie(response, 'refreshToken', refreshToen, 7 * 24 * 60 * 60 * 1000, true)

      return {
        userInfo,
        accessToken
      }
    }
  }

  // 注册接口
  async Register(registerDTO: RegisterDto) {
    const userEmial = await this.userService.findByEmail(registerDTO.email);
    const userName = await this.userService.findByName(registerDTO.username);
    if (userEmial || userName) throw new ConflictException('用户已存在');

    await this.verifyCode(registerDTO.email, registerDTO.emailCode)
    const { emailCode, ...userData } = registerDTO;

    return this.userService.create(userData);
  }

  async Init(registerDTO: RegisterDto): Promise<{ msg: string }> {
    const filePath = path.join(process.cwd(), 'memory.lock');

    try {
      // 检查 memory.lock 是否存在
      await fs.access(filePath);
      throw new BadRequestException('非法访问！')
    } catch (error) {
      console.log('memory.lock 不存在，开始初始化...');
      try {
        await this.verifyCode(registerDTO.email, registerDTO.emailCode)
        const { emailCode, ...userData } = registerDTO;
        await this.userService.super(userData);
        await fs.writeFile(filePath, 'initialized');

        return { msg: '初始化成功' };
      } catch (userError) {
        console.error('初始化失败:', userError);
        throw new BadRequestException('初始化失败，请检查日志');
      }
    }
  }

  // 忘记接口
  async Forget(forgetDTO: ForgetDTO){
    try{
      const user = this.userService.findByEmail(forgetDTO.email)
      if(!user) throw new ForbiddenException('用户不存在')

      // 验证码 
      await this.verifyCode(forgetDTO.email, forgetDTO.emailCode)
      // 更新密码
      return this.userService.updatePassword(forgetDTO.email,forgetDTO.password)
    }catch(error){
      throw new ForbiddenException('Invalid or expired forget password');
    }
  }

  // 退出清除cookie
  Logout(response: Response) {
    return this.cookieService.clearTokenCookie(response, 'refreshToken', true)
  }

  // 刷新Token
  async Refresh(req: Request, res: Response) {
    const refreshToken = this.cookieService.getTokenFromCookie(req, 'refreshToken');
    if (!refreshToken) {
      throw new ForbiddenException('Refresh token is missing');
    }

    try {
      const refresh = await verifyRefreshToken(refreshToken);
      if (!refresh) {
        throw new ForbiddenException('Invalid refresh token');
      }
      const user = await this.userService.findByName(refresh.username);
      if (!user || !user.status) {
        this.cookieService.clearTokenCookie(res, 'refreshToken', true)
        throw new ForbiddenException('用户不存在');
      }
      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role_id,
        status: user.status
      };
      const newAccessToken = generateAccessToken(userInfo);
      return {
        accessToken: newAccessToken
      }
    } catch (error) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  // 发送验证码
  async sendVerificationCode(email: string) {
    try {
      const lockKey = `verify_lock_${email}`;
      const isLocked = await this.cache.get(lockKey);
      if (isLocked) {
        throw new BadRequestException('请 60 秒后再获取验证码');
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.cache.set(`verify_${email}`, code, 60 * 1000);
      await this.cache.set(lockKey, true, 60 * 1000);
      await this.mailService.sendVerificationEmail(email, code)
      return { message: '验证码已发送，请检查邮箱' };
    } catch {
      return { message: '验证码发送失败，请联系管理员' };
    }
  }

  // 验证
  async verifyCode(email: string, inputCode: string) {
    const savedCode = await this.cache.get<string>(`verify_${email}`);
    if (!savedCode || savedCode !== inputCode) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 验证成功后删除验证码
    await this.cache.del(`verify_${email}`);

    return true;
  }

  // 根据GitHub信息注册或登录用户
  async findOrCreate(
    githubId: string,
    username: string,
    email: string,
    avatar: string,
    response: Response
  ) {
    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.create({ password: githubId, username, email, avatar });
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      avatar: user.avatar,
      role: user.role_id,
      status: user.status
    };
    // 这里不返回accessToken 只通过cookie来设置刷新token 用户通过github登录重定向到后台会调用info接口 此时会需要accessToken
    // 如果没有会返回401自动触发刷新接口 此时再下发accessToken，整个过程是无感的
    // const accessToken = generateAccessToken(userInfo);
    const refreshToken = generateRefreshToken(userInfo);

    // 设置 refreshToken 到 cookie 中
    this.cookieService.setTokenCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000, true);
  }
}
