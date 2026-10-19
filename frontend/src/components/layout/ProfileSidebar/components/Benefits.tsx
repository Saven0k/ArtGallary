import { useLanguage } from '../../../../hooks/useLanguage';
import { sidebarTranslations } from '../lang';

export const Benefits = () => {
    const { language } = useLanguage();

    return (
        <div className="sidebarProfile__guest-benefits">
            <div className="sidebarProfile__benefit">
                <span className="sidebarProfile__benefit-icon">🖼️</span>
                <span>{sidebarTranslations[language].author.addPainting}</span>
            </div>
        </div>
    );
};