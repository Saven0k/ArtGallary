// src/pages/Services/ServicesPage.tsx
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { servicesTranslations } from './lang';
import './ServicesPage.scss';
import Navigation from '../../components/layout/Navigation/Navigation';

const ServicesPage = () => {
    const { language } = useLanguage();
    const t = servicesTranslations[language].services;

    return (
        <main className="services-page">
            <Navigation />
            <div className="services-page__container">
                <header className="services-page__header">
                    <h1 className="services-page__title">{t.title}</h1>
                    <p className="services-page__subtitle">{t.subtitle}</p>
                </header>

                <div className="services-page__grid">
                    {t.cards.map((card) => (
                        <article key={card.id} className="service-card">
                            <div className="service-card__icon-wrapper">
                                <img
                                    src={card.icon}
                                    alt={card.title}
                                    className="service-card__icon"
                                />
                            </div>

                            <h2 className="service-card__title">{card.title}</h2>
                            <p className="service-card__description">{card.description}</p>

                            <div className="service-card__divider" />

                            <ul className="service-card__features">
                                {card.features.map((feature, idx) => (
                                    <li key={idx} className="service-card__feature">
                                        {/* <img
                                            src={CheckIcon}
                                            alt=""
                                            className="service-card__feature-icon"
                                        /> */}
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="service-card__price-label">{t.priceLabel}</p>

                            <Link to={`/services/${card.id}`} className="service-card__more">
                                <span>{t.more}</span>
                                {/* <img
                                    src={ArrowIcon}
                                    alt=""
                                    className="service-card__more-icon"
                                /> */}
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default ServicesPage;