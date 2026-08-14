import './AboutPage.scss';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import { translations } from './lang';
import { useLanguage } from '../../hooks/useLanguage';

const AboutPage = () => {
    const { language } = useLanguage();
    const t = translations[language].about;

    return (
        <>
            <Header />
            <main className="about-page">
                <section className="about">
                    <img src="#" alt="TILININ'S GALLERY" className="about__image" />
                    <div className="about__content">
                        <h2 className="about__title">{t.title}</h2>
                        {t.paragraphs.map((paragraph, index) => (
                            <p key={index} className="about__text">
                                {paragraph.highlight && (
                                    <span className="about__text--highlight">{paragraph.highlight}</span>
                                )}
                                {paragraph.text}
                            </p>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default AboutPage;