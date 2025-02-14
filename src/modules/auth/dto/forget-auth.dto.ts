import { IsEmail, IsString } from "class-validator";

export class ForgetDTO {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    emailCode: string;
}