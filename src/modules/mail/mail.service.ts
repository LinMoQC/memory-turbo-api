import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter = nodemailer.createTransport({
        host: 'smtp.qq.com', // 使用 QQ 邮箱的 SMTP 主机
        port: 587,
        secure: false,
        auth: {
            user: '2896311434@qq.com',
            pass: 'xocrjchrlfmzdgad',
        },
    });

    async sendVerificationEmail(email: string, code: string) {
        const mailOptions = {
            from: '"Memory Flow" <2896311434@qq.com>', // 发件人邮箱地址
            to: email, // 收件人邮箱
            subject: 'Email Verification Code', // 邮件标题
            text: `Your verification code is: ${code}`, // 邮件内容（纯文本）
            html: `<p>Your verification code is: <strong>${code}</strong></p>`, // 邮件内容（HTML 格式）
        };


        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Verification code sent to ${email}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send verification email');
        }
    }
}
