import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { mailTemplate } from './mail-template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(this.config.get('SMTP_PORT', 587)),
      secure: Number(this.config.get('SMTP_PORT', 587)) === 465,
      requireTLS: Number(this.config.get('SMTP_PORT', 587)) !== 465,
      connectionTimeout: 5000,
      socketTimeout: 10000,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  get isConfigured(): boolean {
    return !!(
      this.config.get('SMTP_HOST') &&
      this.config.get('SMTP_USER') &&
      this.config.get('SMTP_PASS')
    );
  }

  get siteUrl(): string {
    const url = new URL(
      this.config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    );
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new ServiceUnavailableException('Некорректный адрес сайта');
    return url.origin;
  }

  notificationUrl(link?: string): string {
    const base = this.siteUrl;
    const url = new URL(link || '/profile?section=notifications', base);
    return url.origin === base
      ? url.href
      : base + '/profile?section=notifications';
  }

  async sendNotification(
    to: string,
    title: string,
    body: string,
    link?: string,
    language: 'ru' | 'en' | 'zh' = 'ru',
  ) {
    if (!this.isConfigured)
      throw new ServiceUnavailableException('Почта не подключена');
    const url = this.notificationUrl(link);
    await this.sendMail({
      from: this.config.get('SMTP_FROM') || this.config.get('SMTP_USER'),
      to,
      subject: title,
      text: `${body}\n\n${url}\n\n${this.siteUrl}/settings`,
      html: mailTemplate(title, body, url, this.siteUrl, language),
    });
  }

  private async sendCode(
    to: string,
    code: string,
    subject: string,
    bodyText: string,
  ): Promise<void> {
    if (!this.isConfigured && process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] ${subject} → ${to}: code=${code}`);
      return;
    }

    if (!this.isConfigured)
      throw new ServiceUnavailableException('Почта не подключена');

    await this.sendMail({
      from: this.config.get('SMTP_FROM') || this.config.get('SMTP_USER'),
      to,
      subject,
      text: `${bodyText}: ${code}. Никому не сообщайте код.`,
      html: mailTemplate(
        subject,
        bodyText,
        this.siteUrl,
        this.siteUrl,
        'ru',
        code,
      ),
    });
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    await this.sendCode(to, code, 'Смена пароля', 'Ваш код для смены пароля');
  }

  private async sendMail(options: nodemailer.SendMailOptions) {
    try {
      await this.transporter.sendMail(options);
    } catch {
      throw new ServiceUnavailableException('Почтовый сервер недоступен');
    }
  }

  async sendEmailChangeCode(to: string, code: string): Promise<void> {
    await this.sendCode(
      to,
      code,
      'Подтверждение нового email',
      'Ваш код для подтверждения нового email',
    );
  }

  async sendAccountDeletionCode(to: string, code: string): Promise<void> {
    await this.sendCode(
      to,
      code,
      'Подтверждение удаления аккаунта',
      'Ваш код для подтверждения удаления аккаунта',
    );
  }
}
