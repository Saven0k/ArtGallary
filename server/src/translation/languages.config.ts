export const SUPPORTED_LANGUAGES = ['ru', 'en', 'zh', 'de', 'fr'] as const;
export const DEFAULT_LANGUAGE = 'ru';
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
    ru: 'Русский',
    en: 'English',
    zh: '中文',
    de: 'Deutsch',
    fr: 'Français',
};