import React from 'react';
import { profileSidebarTranslations } from '../lang';
import { useLanguage } from '../../../../hooks/useLanguage';

export const ModerationBanner: React.FC = () => {
    const { language } = useLanguage();
    const lang = profileSidebarTranslations[language];

    return (
        <div className="sidebarProfile__moderation-banner">
            <div className="sidebarProfile__moderation-icon">⏳</div>
            <div className="sidebarProfile__moderation-text">
                <h4>{lang.sidebar.moderationBanner.title}</h4>
                <p>{lang.sidebar.moderationBanner.description}</p>
            </div>
        </div>
    );
};