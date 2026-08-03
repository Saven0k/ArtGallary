import { Link } from 'react-router-dom';
import { translations } from '../lang';
import './Hero.css';
import { useLanguage } from '../../../hooks/useLanguage';

const Hero = () => {
    const { language } = useLanguage();
    const t = translations[language].home.hero;

    return (
        <section className="hero">
            <h1 className="hero__title">{t.title}</h1>
            <h4 className="hero__subtitle">{t.subtitle}</h4>
            <Link to="/register" className="hero__button btn">{t.button}</Link>
        </section>
    );
};

export default Hero;