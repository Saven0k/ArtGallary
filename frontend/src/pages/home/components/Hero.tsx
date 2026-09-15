import { Link } from 'react-router-dom';
import { translations } from '../lang';
import './Hero.scss';
import { useLanguage } from '../../../hooks/useLanguage';

const Hero = () => {
    const { language } = useLanguage();
    const t = translations[language].home.hero;

    // Массив навигационных ссылок для удобства
    const navLinks = [
        { path: '/arts', label: t.nav.paintings },
        { path: '/authors', label: t.nav.guohua },
        { path: '/services', label: t.nav.engravings },
        { path: '/contacts', label: t.nav.painting },
        { path: '/about', label: t.nav.sculptures },
        { path: '/about', label: t.nav.decorative },
        { path: '/about', label: t.nav.gameArt },
        { path: '/about', label: t.nav.posters },
        { path: '/about', label: t.nav.kintsugi },
        { path: '/about', label: t.nav.cinema }
    ];

    return (
        <section className="hero">
            <nav className="hero__nav" role="navigation">
                <ul className="hero__nav-list">
                    {navLinks.map((link, index) => (
                        <li key={index} className="hero__nav-item">
                            <Link to={link.path} className="hero__nav-link">
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <h1 className="hero__title">{t.title}</h1>
            <h4 className="hero__subtitle">{t.subtitle}</h4>
            <Link to="/register" className="hero__button btn">{t.button}</Link>
        </section>
    );
};

export default Hero;