// src/pages/About/components/Banner/Banner.tsx
import { Link } from 'react-router-dom';
import { useLanguage } from "../../../../hooks/useLanguage";
import { translations } from "../../lang";
import "./Banner.scss";

const Banner = () => {
    const { language } = useLanguage();
    const t = translations[language].about.banner;

    return (
        <section className="about-banner">
            <div className="about-banner__container">
                <div className="about-banner__content">
                    <div className="about-banner__text">
                        <p className="about-banner__subtitle">{t.text}</p>
                        <Link to="/arts" className="about-banner__button">
                            {t.button}
                        </Link>
                    </div>

                    <blockquote className="about-banner__quote">
                        {t.quote}
                    </blockquote>
                </div>
            </div>
        </section>
    );
};

export default Banner;