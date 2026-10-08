import React, { useState, useEffect } from 'react';

import { LanguageContext, type Language } from './contexts';
export type { Language } from './contexts';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        return saved === 'en' || saved === 'zh' ? saved : 'ru';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};