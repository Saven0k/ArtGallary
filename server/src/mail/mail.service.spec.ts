import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { mailCodeContent } from './mail-code-content';
import { MailService } from './mail.service';
import { mailTemplate } from './mail-template';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

test.each(['ru', 'en', 'zh'] as const)(
  'account codes are sent as localized email in %s',
  async (language) => {
    const sendMail = jest
      .fn<Promise<void>, [nodemailer.SendMailOptions]>()
      .mockResolvedValue(undefined);
    jest
      .mocked(nodemailer.createTransport)
      .mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);
    const service = new MailService(
      new ConfigService({
        SMTP_HOST: 'smtp.example.test',
        SMTP_USER: 'sender@example.test',
        SMTP_PASS: 'test',
        FRONTEND_URL: 'https://gallery.example.test',
      }),
    );
    await service.sendPasswordResetCode(
      'owner@example.test',
      '123456',
      language,
    );
    await service.sendEmailChangeCode(
      'owner@example.test',
      '123456',
      'new@example.test',
      language,
    );
    await service.sendAccountDeletionCode(
      'owner@example.test',
      '123456',
      language,
    );
    for (const [options] of sendMail.mock.calls) {
      expect(options.to).toBe('owner@example.test');
      expect(options.html).toContain('123456');
      expect(options.text).toContain(mailCodeContent[language].warning);
      if (language !== 'ru') expect(options.text).not.toMatch(/[А-Яа-яЁё]/);
    }
    expect(sendMail.mock.calls[1][0].text).toContain('new@example.test');
  },
);

test('missing SMTP configuration rejects code delivery even in development and never prints a code', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const log = jest
    .spyOn(Logger.prototype, 'log')
    .mockImplementation(() => undefined);
  jest
    .mocked(nodemailer.createTransport)
    .mockReturnValue({} as nodemailer.Transporter);
  const service = new MailService(new ConfigService({}));
  try {
    await expect(
      service.sendPasswordResetCode('owner@example.test', '123456'),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      service.sendEmailChangeCode(
        'owner@example.test',
        '123456',
        'new@example.test',
      ),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      service.sendAccountDeletionCode('owner@example.test', '123456'),
    ).rejects.toMatchObject({ status: 503 });
    expect(log).not.toHaveBeenCalled();
  } finally {
    process.env.NODE_ENV = previous;
    log.mockRestore();
  }
});

test('mail escapes event content and only links back to the configured gallery', async () => {
  const sendMail = jest
    .fn<Promise<void>, [nodemailer.SendMailOptions]>()
    .mockResolvedValue(undefined);
  jest
    .mocked(nodemailer.createTransport)
    .mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);
  const mail = new MailService(
    new ConfigService({
      SMTP_HOST: 'smtp.example.test',
      SMTP_USER: 'sender@example.test',
      SMTP_PASS: 'test',
      FRONTEND_URL: 'https://gallery.example.test',
    }),
  );
  await mail.sendNotification(
    'owner@example.test',
    '<script>alert(1)</script>',
    'Anna & Bob <img src=x>',
    'https://outside.example.test',
    'zh',
  );
  const result = sendMail.mock.calls[0][0];
  expect(result.html).toContain('&lt;script&gt;');
  expect(result.html).toContain('Anna &amp; Bob &lt;img');
  expect(result.html).not.toContain('<script>');
  expect(result.html).not.toContain('outside.example.test');
  expect(result.html).toContain('通知设置');
  expect(result.text).toContain(
    'https://gallery.example.test/profile?section=notifications',
  );
  expect(
    mailTemplate('Code', 'Confirm', mail.siteUrl, mail.siteUrl, 'ru', '123456'),
  ).toContain('123456');
});

test('event mail fails clearly when SMTP credentials are absent', async () => {
  jest
    .mocked(nodemailer.createTransport)
    .mockReturnValue({} as nodemailer.Transporter);
  const mail = new MailService(new ConfigService({}));
  expect(mail.isConfigured).toBe(false);
  await expect(
    mail.sendNotification('owner@example.test', 'Event', 'Body'),
  ).rejects.toMatchObject({ status: 503 });
});

test('SMTP connection failures return an unavailable response without leaking credentials', async () => {
  const sendMail = jest.fn().mockRejectedValue(new Error('SMTP secret error'));
  jest
    .mocked(nodemailer.createTransport)
    .mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);
  const mail = new MailService(
    new ConfigService({
      SMTP_HOST: 'smtp.example.test',
      SMTP_USER: 'sender@example.test',
      SMTP_PASS: 'test',
    }),
  );
  await expect(
    mail.sendNotification('owner@example.test', 'Event', 'Body'),
  ).rejects.toMatchObject({
    status: 503,
    message: 'Почтовый сервер недоступен',
  });
});
