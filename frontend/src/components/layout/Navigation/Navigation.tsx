import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { navigationTranslations } from './lang';
import ArrowLeftIcon from "./icons/arrow.svg";
import './Navigation.scss';

interface BreadcrumbItem {
    path: string;
    label: string;
    isActive: boolean;
}

const Navigation = () => {
    const location = useLocation();
    const { language } = useLanguage();
    const t = navigationTranslations[language].navigation;

    // Маппинг путей на названия
    const routeMap: Record<string, string> = {
        '/': t.home,
        '/arts': t.arts,
        '/artists': t.artists,
        '/authors': t.authors,
        '/services': t.services,
        '/contacts': t.contacts,
        '/about': t.about,
        '/gallery': t.gallery,
        '/profile': t.profile,
        '/cart': t.cart,
        '/likes': t.likes,
        '/search': t.search,
        '/register': t.register,
        '/login': t.login,
    };

    // Создаем хлебные крошки из текущего пути
    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        
        // Если мы на главной, показываем только "Главная"
        if (pathnames.length === 0) {
            return [{ path: '/', label: t.home, isActive: true }];
        }

        const breadcrumbs: BreadcrumbItem[] = [
            { path: '/', label: t.home, isActive: false }
        ];

        let currentPath = '';
        pathnames.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathnames.length - 1;
            
            // Декодируем URL и пытаемся найти в routeMap
            const decodedSegment = decodeURIComponent(segment);
            const label = routeMap[currentPath] || decodedSegment;

            breadcrumbs.push({
                path: currentPath,
                label: label,
                isActive: isLast
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // Определяем, показывать ли кнопку "Назад"
    const showBackButton = location.pathname !== '/';

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="navigation">
            {showBackButton && (
                <button className="navigation__back" onClick={handleGoBack}>
                    <img src={ArrowLeftIcon} alt={t.backArrow} className="navigation__back-icon" />
                    <span className="navigation__back-text">{t.back}</span>
                </button>
            )}

            <div className="navigation__path">
                {breadcrumbs.map((item, index) => (
                    <span key={item.path} className="navigation__path-item">
                        {item.isActive ? (
                            <span className="navigation__path-name navigation__path-name--active">
                                {item.label}
                            </span>
                        ) : (
                            <Link to={item.path} className="navigation__path-link">
                                {item.label}
                            </Link>
                        )}
                        {index < breadcrumbs.length - 1 && (
                            <span className="navigation__path-separator">/</span>
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Navigation;