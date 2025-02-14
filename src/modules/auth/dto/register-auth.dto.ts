import { IsEmail, IsNumber, IsString } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    username: string;

    @IsString()
    password: string;

    @IsString()
    emailCode: string;
}
