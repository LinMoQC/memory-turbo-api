import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    username?: string;

    @IsEmail()
    email?: string;

    @IsNumber()
    role?: number;

    @IsNumber()
    status?: number;

    @IsString()
    avatar?: string;
}
