import { translatedValue } from '../../../utils/translations';


export type Language = 'ru' | 'en' | 'zh';

export interface CodeModalTranslations {
    title: string;
    emailHint: string;
    emailPlaceholder: string;
    sendCode: string;
    sending: string;
    codeHint: string;
    codeSent: string;
    resend: string;
    verify: string;
    checking: string;
    close: string;
    cooldown: string;
    errors: {
        generic: string;
    };
}

export const codeModalTranslations: Record<Language, CodeModalTranslations> = {
    ru: {
        title: 'Подтверждение',
        emailHint: 'Код для смены пароля придёт на почту вашего аккаунта: {email}',
        emailPlaceholder: 'Введите email',
        sendCode: 'Отправить код',
        sending: 'Отправка…',
        codeHint: 'Введите 6-значный код из письма.',
        codeSent: 'Код отправлен на почту',
        resend: 'Отправить код повторно',
        verify: 'Подтвердить',
        checking: 'Проверка…',
        close: 'Закрыть',
        cooldown: 'Код действует 15 минут. Повторная отправка доступна через минуту.',
        errors: {
            generic: 'Не удалось выполнить действие',
        },
    },
    en: {
        title: 'Verification',
        emailHint: 'Your password change code will be sent to your account email: {email}',
        emailPlaceholder: 'Enter your email',
        sendCode: 'Send code',
        sending: 'Sending…',
        codeHint: 'Enter the 6-digit code from your email.',
        codeSent: 'Code has been sent to your email',
        resend: 'Resend code',
        verify: 'Confirm',
        checking: 'Checking…',
        close: 'Close',
        cooldown: 'The code is valid for 15 minutes. You can resend it after one minute.',
        errors: {
            generic: 'Action failed',
        },
    },
    zh: {
        title: '验证',
        emailHint: '密码修改验证码将发送至您的账户邮箱：{email}',
        emailPlaceholder: '请输入邮箱',
        sendCode: '发送验证码',
        sending: '发送中…',
        codeHint: '请输入邮件中的 6 位验证码。',
        codeSent: '验证码已发送至您的邮箱',
        resend: '重新发送验证码',
        verify: '确认',
        checking: '验证中…',
        close: '关闭',
        cooldown: '验证码有效期为15分钟，一分钟后可重新发送。',
        errors: {
            generic: '操作失败',
        },
    },
};

export const getCodeModalTranslation = (
    lang: Language,
    path: string,
): string => {
    return translatedValue(codeModalTranslations[lang], path);
};

export const useCodeModalTranslation = (lang: Language) => {
    return {
        t: (path: string) => getCodeModalTranslation(lang, path),
        translations: codeModalTranslations[lang],
    };
};
