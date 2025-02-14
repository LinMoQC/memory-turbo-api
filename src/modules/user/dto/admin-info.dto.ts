import { IsEmail, IsString } from "class-validator";

export class AdminInfo {
    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    avatar: string;
}