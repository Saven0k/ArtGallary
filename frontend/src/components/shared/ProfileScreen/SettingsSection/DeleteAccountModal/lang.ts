export type Language = 'ru' | 'en' | 'zh';

export const deleteAccountTranslations = {
    ru: {
        title: 'Удаление аккаунта',
        codeHint: 'Введите код из письма, отправленного на вашу почту',
        codeSent: 'Код отправлен на вашу почту',
        resend: 'Отправить код повторно',
        sending: 'Отправка…',
        verify: 'Подтвердить',
        checking: 'Проверка…',
        cancel: 'Отмена',
        warningText:
            'Вы точно хотите удалить аккаунт? Ваш аккаунт и все работы будут скрыты. Вы сможете восстановить его в течение 5 лет.',
        yesDelete: 'Да, удалить',
        noKeep: 'Нет, оставить',
        deleting: 'Удаление…',
        errors: {
            generic: 'Что-то пошло не так',
        },
    },
    en: {
        title: 'Delete account',
        codeHint: 'Enter the code sent to your email',
        codeSent: 'Code sent to your email',
        resend: 'Resend code',
        sending: 'Sending…',
        verify: 'Confirm',
        checking: 'Checking…',
        cancel: 'Cancel',
        warningText:
            'Are you sure you want to delete your account? Your account and all artworks will be hidden. You can restore it within 5 years.',
        yesDelete: 'Yes, delete',
        noKeep: 'No, keep it',
        deleting: 'Deleting…',
        errors: {
            generic: 'Something went wrong',
        },
    },
    zh: {
        title: '删除账户',
        codeHint: '请输入发送到您邮箱的验证码',
        codeSent: '验证码已发送至您的邮箱',
        resend: '重新发送验证码',
        sending: '发送中…',
        verify: '确认',
        checking: '验证中…',
        cancel: '取消',
        warningText:
            '您确定要删除账户吗？您的账户和所有作品将被隐藏。您可以在 5 年内恢复账户。',
        yesDelete: '是的，删除',
        noKeep: '不，保留',
        deleting: '删除中…',
        errors: {
            generic: '出现错误',
        },
    },
};