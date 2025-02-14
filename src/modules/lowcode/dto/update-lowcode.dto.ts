import { IsString } from 'class-validator';

export class UpdateLowcodeDto {
    @IsString()
    template_name: string;

    @IsString()
    template_json: string;
}