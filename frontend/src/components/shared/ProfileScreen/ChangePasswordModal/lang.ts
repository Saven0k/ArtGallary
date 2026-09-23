// src/pages/Profile/components/ProfileContent/ChangePasswordModal/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export interface ChangePasswordTranslations {
    title: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    placeholders: {
        current: string;
        new: string;
        confirm: string;
    };
    showPassword: string;
    hidePassword: string;
    submit: string;
    saving: string;
    cancel: string;
    errors: {
        currentRequired: string;
        newRequired: string;
        newMin: string;
        newMax: string;
        mismatch: string;
        sameAsCurrent: string;
        generic: string;
    };
}

export const changePasswordTranslations: Record<Language, ChangePasswordTranslations> = {
    ru: {
        title: 'Изменение пароля',
        currentPassword: 'Текущий пароль',
        newPassword: 'Новый пароль',
        confirmPassword: 'Повторите новый пароль',
        placeholders: {
            current: 'Введите текущий пароль',
            new: 'Минимум 8 символов',
            confirm: 'Повторите новый пароль',
        },
        showPassword: 'Показать пароль',
        hidePassword: 'Скрыть пароль',
        submit: 'Изменить пароль',
        saving: 'Сохранение…',
        cancel: 'Отмена',
        errors: {
            currentRequired: 'Введите текущий пароль',
            newRequired: 'Введите новый пароль',
            newMin: 'Пароль должен содержать минимум 8 символов',
            newMax: 'Пароль не должен превышать 25 символов',
            mismatch: 'Пароли не совпадают',
            sameAsCurrent: 'Новый пароль совпадает с текущим',
            generic: 'Не удалось изменить пароль',
        },
    },

    en: {
        title: 'Change password',
        currentPassword: 'Current password',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        placeholders: {
            current: 'Enter current password',
            new: 'At least 8 characters',
            confirm: 'Repeat new password',
        },
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        submit: 'Change password',
        saving: 'Saving…',
        cancel: 'Cancel',
        errors: {
            currentRequired: 'Enter your current password',
            newRequired: 'Enter a new password',
            newMin: 'Password must be at least 8 characters',
            newMax: 'Password must not exceed 25 characters',
            mismatch: 'Passwords do not match',
            sameAsCurrent: 'New password matches the current one',
            generic: 'Failed to change password',
        },
    },

    zh: {
        title: '修改密码',
        currentPassword: '当前密码',
        newPassword: '新密码',
        confirmPassword: '确认新密码',
        placeholders: {
            current: '请输入当前密码',
            new: '至少 8 个字符',
            confirm: '请再次输入新密码',
        },
        showPassword: '显示密码',
        hidePassword: '隐藏密码',
        submit: '修改密码',
        saving: '保存中…',
        cancel: '取消',
        errors: {
            currentRequired: '请输入当前密码',
            newRequired: '请输入新密码',
            newMin: '密码至少需要 8 个字符',
            newMax: '密码不能超过 25 个字符',
            mismatch: '密码不匹配',
            sameAsCurrent: '新密码与当前密码相同',
            generic: '修改密码失败',
        },
    },
};

export const getChangePasswordTranslation = (
    lang: Language,
    path: string,
): string => {
    const keys = path.split('.');
    let result: any = changePasswordTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useChangePasswordTranslation = (lang: Language) => {
    return {
        t: (path: string) => getChangePasswordTranslation(lang, path),
        translations: changePasswordTranslations[lang],
    };
};