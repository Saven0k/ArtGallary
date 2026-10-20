export type Language = 'ru' | 'en' | 'zh';

export const deleteAccountTranslations = {
    ru: {
        title: 'Удаление аккаунта',
        emailHint: 'Код подтверждения придёт на почту аккаунта: {email}',
        sendCode: 'Получить код',
        cooldown: 'Код действует 15 минут. Повторная отправка доступна через минуту.',
        codeHint: 'Введите код из письма, отправленного на вашу почту',
        codeSent: 'Код отправлен на вашу почту',
        resend: 'Отправить код повторно',
        sending: 'Отправка…',
        verify: 'Подтвердить',
        checking: 'Проверка…',
        cancel: 'Отмена',
        warningText:
            'Удаление скроет ваш аккаунт и работы. Введите код из письма и нажмите «Да, удалить», чтобы подтвердить действие.',
        yesDelete: 'Да, удалить',
        noKeep: 'Нет, оставить',
        deleting: 'Удаление…',
        errors: {
            generic: 'Что-то пошло не так',
        },
    },
    en: {
        title: 'Delete account',
        emailHint: 'A confirmation code will be sent to your account email: {email}',
        sendCode: 'Get code',
        cooldown: 'The code is valid for 15 minutes. You can resend it after one minute.',
        codeHint: 'Enter the code sent to your email',
        codeSent: 'Code sent to your email',
        resend: 'Resend code',
        sending: 'Sending…',
        verify: 'Confirm',
        checking: 'Checking…',
        cancel: 'Cancel',
        warningText:
            'Deleting your account will hide your profile and artworks. Enter the email code and click “Yes, delete” to confirm.',
        yesDelete: 'Yes, delete',
        noKeep: 'No, keep it',
        deleting: 'Deleting…',
        errors: {
            generic: 'Something went wrong',
        },
    },
    zh: {
        title: '删除账户',
        emailHint: '确认验证码将发送至您的账户邮箱：{email}',
        sendCode: '获取验证码',
        cooldown: '验证码有效期为15分钟，一分钟后可重新发送。',
        codeHint: '请输入发送到您邮箱的验证码',
        codeSent: '验证码已发送至您的邮箱',
        resend: '重新发送验证码',
        sending: '发送中…',
        verify: '确认',
        checking: '验证中…',
        cancel: '取消',
        warningText:
            '删除后，您的账户和作品将被隐藏。请输入邮件中的验证码，然后点击“是的，删除”以确认操作。',
        yesDelete: '是的，删除',
        noKeep: '不，保留',
        deleting: '删除中…',
        errors: {
            generic: '出现错误',
        },
    },
};
