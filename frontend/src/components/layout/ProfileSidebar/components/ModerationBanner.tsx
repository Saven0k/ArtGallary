
import React from 'react';
import { Clock3 } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { sidebarTranslations } from '../lang';

export const ModerationBanner: React.FC = () => {
    const { language } = useLanguage();
    const t = sidebarTranslations[language];

    return (
        <div className="sidebarProfile__moderation-banner">
            <div className="sidebarProfile__moderation-icon" aria-hidden="true"><Clock3 size={20} /></div>
            <span className="sidebarProfile__moderation-text">
                {t.moderationBanner}
            </span>
        </div>
    );
};
