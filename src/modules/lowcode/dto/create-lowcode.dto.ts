import { IsString } from "class-validator";

export class CreateLowcodeDto {
    @IsString()
    template_name: string;

    @IsString()
    template_json: string;

    @IsString()
    username: string;
}
