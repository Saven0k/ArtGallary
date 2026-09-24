// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
            port: Number(this.config.get('SMTP_PORT', 587)),
            secure: false,
            auth: {
                user: this.config.get('SMTP_USER'),
                pass: this.config.get('SMTP_PASS'),
            },
        });
    }

    /** Универсальный метод: шлёт код с указанной темой и текстом */
    private async sendCode(
        to: string,
        code: string,
        subject: string,
        bodyText: string,
    ): Promise<void> {
        // На dev не мучаем Gmail — просто пишем код в консоль
        if (process.env.NODE_ENV !== 'production') {
            this.logger.log(`[DEV] ${subject} → ${to}: code=${code}`);
            return;
        }

        await this.transporter.sendMail({
            from: this.config.get('SMTP_FROM'),
            to,
            subject,
            html: `
                <p>${bodyText}: <b style="font-size:22px;letter-spacing:2px">${code}</b></p>
                <p>Код действует 15 минут. Если вы не запрашивали это действие — проигнорируйте письмо.</p>
            `,
        });
    }

    /** Код для смены пароля (используется в password-reset) */
    async sendPasswordResetCode(to: string, code: string): Promise<void> {
        await this.sendCode(to, code, 'Смена пароля', 'Ваш код для смены пароля');
    }

    /** Код для смены email (шлём на НОВЫЙ адрес, чтобы подтвердить владение) */
    async sendEmailChangeCode(to: string, code: string): Promise<void> {
        await this.sendCode(
            to,
            code,
            'Подтверждение нового email',
            'Ваш код для подтверждения нового email',
        );
    }
}