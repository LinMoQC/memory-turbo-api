import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
    constructor(private readonly prisma: PrismaService) { }

    async getRoles() {
        return this.prisma.roles.findMany({
            include: {
                role_permissions: {
                    select: {
                        permission_id: true,  
                    },
                },
            },
        });
    }
}
