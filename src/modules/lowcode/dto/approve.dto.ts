import { IsNumber, IsString } from "class-validator";

export class ApproveDTO {

    @IsString()
    template_key: string;

    @IsString()
    approver: string;
}