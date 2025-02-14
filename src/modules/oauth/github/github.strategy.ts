import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALL_BACKURL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // GitHub 返回的用户信息
    try {
      const { username, displayName, _json, emails, id, photos } = profile;
      const { email } = _json

      return {
        githubId: id,
        username: displayName ? displayName : username,
        email: email,
        avatar: photos[0].value,
      };
    } catch (err) {
      console.error('GitHub Strategy Validate Error:', err);
      throw new UnauthorizedException('无法验证 GitHub 用户信息');
    }
  }
}
