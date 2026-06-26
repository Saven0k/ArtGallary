import { useLanguage } from '../../../context/LanguageContext';
import { profileSidebarTranslations } from './lang';

export const Benefits = () => {
    const { language } = useLanguage();
    const lang = profileSidebarTranslations[language];

    return (
        <div className="sidebarProfile__guest-benefits">
            <div className="sidebarProfile__benefit">
                <span className="sidebarProfile__benefit-icon">🖼️</span>
                <span>{lang.benefits.addArt}</span>
            </div>
            <div className="sidebarProfile__benefit">
                <span className="sidebarProfile__benefit-icon">🎨</span>
                <span>{lang.benefits.participate}</span>
            </div>
            <div className="sidebarProfile__benefit">
                <span className="sidebarProfile__benefit-icon">💬</span>
                <span>{lang.benefits.chat}</span>
            </div>
        </div>
    );
};