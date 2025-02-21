# 📡 Memory API  

Memory 项目的后端服务，基于 [NestJS](https://nestjs.com/) 框架，并使用 [Prisma](https://www.prisma.io/) 作为 ORM。  

## 🚀 技术栈

- [NestJS](https://nestjs.com/) - 基于 TypeScript 的渐进式 Node.js 框架  
- [Prisma](https://www.prisma.io/) - 现代化的数据库 ORM  
- [PostgreSQL](https://www.postgresql.org/) / [MySQL](https://www.mysql.com/) - 可选的数据库支持  
- [Swagger](https://swagger.io/) - API 文档  
- [Redis](https://redis.io/) - 缓存和 WebSocket 支持  
- [JWT](https://jwt.io/) - 认证和授权  
- [Socket.IO](https://socket.io/) - 实时通信库

## 📌 安装 & 运行  

### 1️⃣ 安装依赖  
```sh
pnpm install
```
### 2️⃣ 配置环境变量
```sh
cp .env.example .env
```
```sh
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

# 数据库地址
DATABASE_URL=""

# accessToken密钥
ACCESS_TOKEN_SECRET = ''
# refreshToken密钥
REFRESH_TOKEN_SECRET = ''

# 后端启动端口
PORT=5666

# 前端后台首页
FRONTEND_HOME_URL = 'http://localhost:3000/proxy/dashboard'

# Github登录配置
GITHUB_CLIENT_ID= ''
GITHUB_CLIENT_SECRET= ''
GITHUB_CALL_BACKURL= 'http://localhost:5666/api/auth/github/callback'

# Redis配置
REDIS_HOST = ''
REDIS_PORT = ''
REDIS_PASSWORD = ''
```

### 3️⃣ 运行数据库迁移
```sh
pnpm prisma migrate dev --name init
# 如果仅需同步数据库但不生成迁移文件
pnpm prisma db push
```

### 4️⃣ 启动开发环境
```sh
pnpm run start:dev
```

## 🛠 API 文档
```sh
http://localhost:5666/api/docs
```

## 🛜 WebSocket
``` ts
// WebSocket 通过 Socket.io 实现，默认监听 /ws 端点
const socket = io("http://localhost:5666");
socket.on("connect", () => {
    console.log("Connected!");
});
```
## 📧 邮件服务
``` ts
// 使用 Nodemailer 进行邮件发送，需在 .env 中配置 SMTP 信息
import * as nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

await transporter.sendMail({
    from: '"Memory" <no-reply@memory.com>',
    to: 'user@example.com',
    subject: '测试邮件',
    text: 'Hello, 这是一封测试邮件！',
});
```

## 🛠 其他常用命令
```sh
pnpm lint                # 代码检查
pnpm test                # 运行测试
pnpm prisma studio       # Prisma 可视化数据库管理
pnpm prisma generate     # 生成 Prisma 客户端
pnpm prisma migrate dev  # 创建数据库迁移
pnpm prisma migrate deploy # 部署迁移到生产环境
```
