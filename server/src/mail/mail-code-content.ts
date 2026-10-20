export const mailCodeContent = {
  ru: {
    password: ['Смена пароля', 'Ваш код для смены пароля'],
    email: ['Смена email', 'Код подтверждает смену почты на {email}'],
    deletion: ['Удаление аккаунта', 'Ваш код для удаления аккаунта'],
    warning:
      'Код действует 15 минут. Никому не сообщайте его. Если вы не запрашивали это действие, проигнорируйте письмо.',
  },
  en: {
    password: ['Change password', 'Your code to change your password'],
    email: [
      'Change email',
      'This code confirms changing your email to {email}',
    ],
    deletion: ['Delete account', 'Your code to delete your account'],
    warning:
      'This code is valid for 15 minutes. Do not share it. If you did not request this action, ignore this email.',
  },
  zh: {
    password: ['修改密码', '您的密码修改验证码'],
    email: ['修改邮箱', '此验证码用于将邮箱更改为 {email}'],
    deletion: ['删除账户', '您的账户删除验证码'],
    warning:
      '验证码有效期为15分钟。请勿向他人透露。如果您未请求此操作，请忽略此邮件。',
  },
} as const;
