import { Link } from 'react-router-dom';
import { translations } from '../lang';
import './About.scss';
import { useLanguage } from '../../../hooks/useLanguage';
import AboutImage from "../images/about.png"
const About = () => {
    const { language } = useLanguage();
    const t = translations[language].home.about;

    return (
        <section className="about">
            <img src={AboutImage} alt={t.imageAlt} className="about__image" />
            <div className="about__content">
                <h2 className="about__title">{t.title}</h2>
                <p className="about__text">
                    <span className="about__text--highlight">{t.highlight}</span>
                    {t.text}
                </p>
                <ul className="about__pros">
                    {t.benefits.map((benefit) => <li key={benefit} className="about__plus">{benefit}</li>)}
                </ul>
                <ul className="about__stats">
                    <li className="about__stat">
                        <h2 className="about__stat-number">70+</h2>
                        <h5 className="about__stat-label">{t.stats.works}</h5>
                    </li>
                    <li className="about__stat">
                        <h2 className="about__stat-number">10+</h2>
                        <h5 className="about__stat-label">{t.stats.authors}</h5>
                    </li>
                    <li className="about__stat">
                        <h2 className="about__stat-number">20+</h2>
                        <h5 className="about__stat-label">{t.stats.clients}</h5>
                    </li>
                </ul>
                <Link to="/authors" className="about__link">{t.link}</Link>
            </div>
        </section>
    );
};

export default About;
