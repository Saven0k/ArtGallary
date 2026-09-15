// src/pages/About/components/AboutUs/AboutUs.tsx
import { useLanguage } from "../../../../hooks/useLanguage";
import { translations } from "../../lang";
import AboutImage from "../../images/tema.png";
import "./AboutUs.scss";

const AboutUs = () => {
    const { language } = useLanguage();
    const t = translations[language].about;

    return (
        <section className="about-us">
            <div className="about-us__container">
                <div className="about-us__image-wrapper">
                    <img 
                        src={AboutImage} 
                        alt="TILININ'S GALLERY" 
                        className="about-us__image" 
                    />
                </div>
                <div className="about-us__content">
                    <h1 className="about-us__title">{t.title}</h1>
                    
                    {t.paragraphs.map((paragraph, index) => (
                        <p key={index} className="about-us__text">
                            {paragraph.highlight && (
                                <span className="about-us__text--highlight">{paragraph.highlight}</span>
                            )}
                            {paragraph.text}
                        </p>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutUs;