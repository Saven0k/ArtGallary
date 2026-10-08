import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { mailTemplate } from './mail-template';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

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
