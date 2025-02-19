import { Injectable, Res } from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * Cookie 服务提供清除、设置和获取 Token 的功能。
 */
@Injectable()
export class CookieService {
    /**
     * 设置指定的 token。
     * @param response - Express 的响应对象。
     * @param tokenName - Token 名称 ('accessToken' 或 'refreshToken')。
     * @param tokenValue - 要存储的 token 值。
     * @param maxAge - Token 的过期时间（单位：秒）。
     */
    setTokenCookie(response: Response, tokenName: string, tokenValue: string, maxAge: number,httpOnly: boolean): void {
        response.cookie(tokenName, tokenValue, {
            httpOnly: httpOnly,
            maxAge,
            sameSite: 'lax',
            secure: true,
        });
    }

    setRoleCookie(response: Response,role: number, maxAge: number,httpOnly: boolean): void {
        response.cookie('Role', role, {
            httpOnly: httpOnly,
            maxAge,
            sameSite: 'lax',
            secure: true,
        });
    }

    /**
     * 清除指定的 token。
     * @param response - Express 的响应对象。
     * @param tokenName - 要清除的 token 名称 ('accessToken' 或 'refreshToken')。
     */
    clearTokenCookie(response: Response, tokenName: string,httpOnly: boolean): void {
        response.clearCookie(tokenName, {
            httpOnly: httpOnly,
            sameSite: 'none',
            secure: true,
        });
    }

    /**
     * 获取指定的 token。
     * @param request - Express 的请求对象。
     * @param tokenName - Token 名称 ('accessToken' 或 'refreshToken')。
     * @returns 返回存储在 cookie 中的 token。
     */
    getTokenFromCookie(request: Request, tokenName: string): string | undefined {
        return request.cookies[tokenName];
    }
}

