// src/components/ProfileSideBar/components/ModerationBanner.tsx
import React from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { sidebarTranslations } from '../lang';

export const ModerationBanner: React.FC = () => {
    const { language } = useLanguage();
    const t = sidebarTranslations[language];

    return (
        <div className="sidebarProfile__moderation-banner">
            <div className="sidebarProfile__moderation-icon">⏳</div>
            <span className="sidebarProfile__moderation-text">
                {t.moderationBanner}
            </span>
        </div>
    );
};