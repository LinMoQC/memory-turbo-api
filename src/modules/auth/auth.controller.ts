import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login-auth.dto';
import { RegisterDto } from './dto/register-auth.dto';
import { Request, Response } from 'express'
import { AuthGuard } from '@nestjs/passport';
import { ForgetDTO } from './dto/forget-auth.dto';

/**
 * Auth下的所有接口都不需要jwt验证
 */

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(200)
  @Post('login')
  login(@Body() loginDto: LoginDTO, @Res({ passthrough: true }) response: Response) {
    return this.authService.Login(loginDto, response)
  }

  @HttpCode(201)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.Register(registerDto)
  }

  @HttpCode(201)
  @Post('forget')
  forget(@Body() forgetDTO: ForgetDTO){
    return this.authService.Forget(forgetDTO)
  }

  @HttpCode(200)
  @Get('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.Logout(response)
  }

  @HttpCode(200)
  @Get('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.Refresh(req, res)
  }

  @HttpCode(200)
  @Post('email-code')
  getEmailCode(@Body('email') email: string) {
    return this.authService.sendVerificationCode(email)
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // 这个方法会由 Passport 自动调用
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubLoginCallback(@Req() req, @Res() res: Response) {
    const { githubId, username, email, avatar } = req.user;

    if(!email) throw new ForbiddenException("Github Email 需要设置为public");

    try {
      await this.authService.findOrCreate(githubId, username, email, avatar, res);
      
      res.redirect(process.env.FRONTEND_HOME_URL);
    } catch (error) {
      // res.redirect('http://localhost:3000/login'); // 登录失败跳转回登录页
      throw new ForbiddenException("GitHub 登录错误", error);
    }
  }
}
