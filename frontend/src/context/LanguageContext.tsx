import React, { useState, useEffect, useCallback } from 'react';

import { LanguageContext, type Language } from './contexts';
export type { Language } from './contexts';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, updateLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        return saved === 'en' || saved === 'zh' ? saved : 'ru';
    });

    const setLanguage = useCallback((next: Language) => {
        localStorage.setItem('language', next);
        updateLanguage(next);
    }, []);

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
