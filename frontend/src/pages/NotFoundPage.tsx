import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const NotFoundPage = () => {
    const { language } = useLanguage();
    return <main className="page"><h1>404</h1><p>{language === 'ru' ? 'Страница не найдена' : language === 'zh' ? '页面未找到' : 'Page not found'}</p><Link to="/">{language === 'ru' ? 'На главную' : language === 'zh' ? '首页' : 'Home'}</Link></main>;
};
export default NotFoundPage;
