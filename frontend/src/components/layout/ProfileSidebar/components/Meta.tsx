// src/components/ProfileSideBar/components/Meta.tsx
import React from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { sidebarTranslations } from '../lang';

export const Meta: React.FC = () => {
    const { language } = useLanguage();
    const t = sidebarTranslations[language];

    return (
        <div className="sidebarProfile__meta">
            <a href="/privacy" className="sidebarProfile__meta-link">{t.privacy}</a>
            <a href="/terms" className="sidebarProfile__meta-link">{t.terms}</a>
        </div>
    );
};