// src/components/layout/CodeModal/lang.ts

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
    errors: {
        generic: string;
    };
}

export const codeModalTranslations: Record<Language, CodeModalTranslations> = {
    ru: {
        title: 'Подтверждение',
        emailHint: 'Введите email — мы отправим на него 6-значный код.',
        emailPlaceholder: 'Введите email',
        sendCode: 'Отправить код',
        sending: 'Отправка…',
        codeHint: 'Введите 6-значный код из письма.',
        codeSent: 'Код отправлен на почту',
        resend: 'Отправить код повторно',
        verify: 'Подтвердить',
        checking: 'Проверка…',
        errors: {
            generic: 'Не удалось выполнить действие',
        },
    },
    en: {
        title: 'Verification',
        emailHint: 'Enter your email — we will send a 6-digit code to it.',
        emailPlaceholder: 'Enter your email',
        sendCode: 'Send code',
        sending: 'Sending…',
        codeHint: 'Enter the 6-digit code from your email.',
        codeSent: 'Code has been sent to your email',
        resend: 'Resend code',
        verify: 'Confirm',
        checking: 'Checking…',
        errors: {
            generic: 'Action failed',
        },
    },
    zh: {
        title: '验证',
        emailHint: '请输入邮箱，我们将向该邮箱发送 6 位验证码。',
        emailPlaceholder: '请输入邮箱',
        sendCode: '发送验证码',
        sending: '发送中…',
        codeHint: '请输入邮件中的 6 位验证码。',
        codeSent: '验证码已发送至您的邮箱',
        resend: '重新发送验证码',
        verify: '确认',
        checking: '验证中…',
        errors: {
            generic: '操作失败',
        },
    },
};

export const getCodeModalTranslation = (
    lang: Language,
    path: string,
): string => {
    const keys = path.split('.');
    let result: any = codeModalTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useCodeModalTranslation = (lang: Language) => {
    return {
        t: (path: string) => getCodeModalTranslation(lang, path),
        translations: codeModalTranslations[lang],
    };
};