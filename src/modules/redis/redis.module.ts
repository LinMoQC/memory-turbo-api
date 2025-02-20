import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Global() 
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',  // 注册 Redis 客户端为提供者
            useFactory: () => {
                const client = new Redis({
                    host: process.env.REDIS_HOST,
                    port: 14767,
                    password: process.env.REDIS_PASSWORD
                });
                return client;
            },
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService], // 导出 REDIS_CLIENT 供其他模块使用
})
export class RedisModule { }
