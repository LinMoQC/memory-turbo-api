/**
 * 全局用户DTO
 */
export class UserDTO {
    id?: number;
    username: string;
    email: string;
    password?: string;
    role: number;
    avatar?: string;
    status?: number;
    last_login_at?: Date | null;
    updated_at?: Date | null;
    created_at?: Date | null;
}