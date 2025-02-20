/**
 * 低代码DTO
 */
export class LowcodeTemplateDTO {
    id: number;
    template_key: string;
    template_name: string;
    template_json: string;
    username: string;
    status?: string;
    updated_at?: Date | null;
    created_at?: Date | null;
}