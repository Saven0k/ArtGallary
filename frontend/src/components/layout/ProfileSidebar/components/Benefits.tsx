import { useLanguage } from '../../../../hooks/useLanguage';
import { profileSidebarTranslations } from '../lang';

export const Benefits = () => {
    const { language } = useLanguage();
    const lang = profileSidebarTranslations[language];

    return (
        <div className="sidebarProfile__guest-benefits">
            <div className="sidebarProfile__benefit">
                <span className="sidebarProfile__benefit-icon">🖼️</span>
                <span>{lang.benefits.addArt || 'Добавляйте свои картины'}</span>
            </div>
        </div>
    );
};