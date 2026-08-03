import { useLanguage } from '../../../../hooks/useLanguage';
import { profileSidebarTranslations } from '../lang';

export const Meta = () => {
    const { language } = useLanguage();
    const lang = profileSidebarTranslations[language];

    return (
        <div className="sidebarProfile__meta">
            <a href="/privacy" className="sidebarProfile__meta-link">{lang.meta.privacy}</a>
            <a href="/terms" className="sidebarProfile__meta-link">{lang.meta.terms}</a>
        </div>
    );
};