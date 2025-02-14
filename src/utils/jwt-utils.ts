import { JwtService } from '@nestjs/jwt';
import { UserDTO } from 'src/shared/user-dto';

export interface UserPayload extends UserDTO {
    iat: number;
    exp: number;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// 创建一个实例化的 JwtService，用于签名和验证 JWT
const jwtService = new JwtService({
    secret: ACCESS_TOKEN_SECRET,
    signOptions: { expiresIn: '7d' }, // 默认的过期时间
});

/**
 * 生成访问令牌 (Access Token)
 * 
 * @param {user} user - 用户信息对象，包括用户的 ID、角色等信息
 * @returns {string} 返回生成的 JWT 访问令牌
 */
export function generateAccessToken(user: UserDTO): string {
    return jwtService.sign(user, {
        secret: ACCESS_TOKEN_SECRET,
        expiresIn: 30*60, 
    });
}

/**
 * 校验访问令牌
 * 
 * @param {token} token - 需要校验的访问令牌
 * @returns {Promise<UserPayload>} 返回解码后的用户信息
 */
export async function verifyAccessToken(token: string): Promise<UserPayload> {
    try {
        const decoded = await jwtService.verifyAsync(token, {
            secret: ACCESS_TOKEN_SECRET,
        });
        return decoded as UserPayload;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
}

/**
 * 生成刷新令牌 (Refresh Token)
 * 
 * @param {user} user - 用户信息对象
 * @returns {string} 返回生成的 JWT 刷新令牌
 */
export function generateRefreshToken(user: UserDTO): string {
    return jwtService.sign(user, {
        secret: REFRESH_TOKEN_SECRET,
        expiresIn: '7d', 
    });
}

/**
 * 校验刷新令牌
 * 
 * @param {token} token - 需要校验的访问令牌
 * @returns {Promise<UserPayload>} 返回解码后的用户信息
 */
export async function verifyRefreshToken(token: string): Promise<UserPayload> {
    try {
        const decoded = await jwtService.verifyAsync(token, {
            secret: REFRESH_TOKEN_SECRET,
        });
        return decoded as UserPayload;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
}

/**
 * 解码访问令牌 (Access Token)
 * 
 * @param {token} token - 需要解码的访问令牌
 * @returns {UserPayload} 返回解码后的用户信息
 */
export function decodeAccessToken(token: string): UserPayload {
    try {
        const decoded = jwtService.decode(token) as UserPayload;
        return decoded;
    } catch (error) {
        throw new Error('Unable to decode token');
    }
}
