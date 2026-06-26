import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import { footerTranslations } from "./lang";
import "./index.css";

const Footer = memo(() => {
    const { language } = useLanguage();
    const lang = footerTranslations[language];
    const currentYear = new Date().getFullYear();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="footer">
            <div className="footer__waves">
                <svg className="footer__wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="url(#gradient)" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="footer__content">
                <div className="footer__container">
                    <div className="footer__grid">
                        {/* Колонка 1 - О проекте */}
                        <div className="footer__column">
                            <div className="footer__logo">
                                <span className="footer__logo-icon">🎨</span>
                                <span className="footer__logo-text">ArtGallery</span>
                            </div>
                            <p className="footer__description">
                                {lang.description}
                            </p>
                            <div className="footer__social">
                                <a href="#" className="footer__social-link" aria-label="Facebook">
                                    <svg className="footer__social-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                                    </svg>
                                </a>
                                <a href="#" className="footer__social-link" aria-label="Instagram">
                                    <svg className="footer__social-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="2" y="2" width="20" height="20" rx="4" ry="4"/>
                                        <circle cx="12" cy="12" r="4"/>
                                        <line x1="18.5" y1="5.5" x2="18.5" y2="5.5" strokeWidth="2"/>
                                    </svg>
                                </a>
                                <a href="#" className="footer__social-link" aria-label="Twitter">
                                    <svg className="footer__social-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                                    </svg>
                                </a>
                                <a href="#" className="footer__social-link" aria-label="Telegram">
                                    <svg className="footer__social-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.08 4.37l-3.24 15.3c-.24 1.1-.9 1.36-1.82.84l-5.02-3.72-2.42 2.33c-.27.26-.5.5-1.02.5l.36-5.14L18.67 6.5c.4-.36-.09-.55-.62-.2L6.8 12.53l-4.88-1.52c-1-.3-1.02-1 .2-1.48L20.63 3.2c.84-.3 1.56.2 1.45 1.17z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Колонка 2 - Быстрые ссылки */}
                        <div className="footer__column">
                            <h3 className="footer__title">{lang.quickLinks.title}</h3>
                            <ul className="footer__links">
                                <li><Link to="/arts" className="footer__link">{lang.quickLinks.gallery}</Link></li>
                                <li><Link to="/artists" className="footer__link">{lang.quickLinks.artists}</Link></li>
                                <li><Link to="/exhibitions" className="footer__link">{lang.quickLinks.exhibitions}</Link></li>
                                <li><Link to="/profile" className="footer__link">{lang.quickLinks.profile}</Link></li>
                            </ul>
                        </div>

                        {/* Колонка 3 - Информация */}
                        <div className="footer__column">
                            <h3 className="footer__title">{lang.info.title}</h3>
                            <ul className="footer__links">
                                <li><Link to="/about" className="footer__link">{lang.info.about}</Link></li>
                                <li><Link to="/contacts" className="footer__link">{lang.info.contacts}</Link></li>
                                <li><Link to="/help" className="footer__link">{lang.info.help}</Link></li>
                                <li><Link to="/privacy" className="footer__link">{lang.info.privacy}</Link></li>
                            </ul>
                        </div>

                        {/* Колонка 4 - Контакты и подписка */}
                        <div className="footer__column">
                            <h3 className="footer__title">{lang.contact.title}</h3>
                            <div className="footer__contact-info">
                                <div className="footer__contact-item">
                                    <span className="footer__contact-icon">📧</span>
                                    <a href="mailto:support@artgallery.com" className="footer__contact-link">
                                        support@artgallery.com
                                    </a>
                                </div>
                                <div className="footer__contact-item">
                                    <span className="footer__contact-icon">📞</span>
                                    <a href="tel:+78001234567" className="footer__contact-link">
                                        +7 (800) 123-45-67
                                    </a>
                                </div>
                                <div className="footer__contact-item">
                                    <span className="footer__contact-icon">📍</span>
                                    <span className="footer__contact-text">{lang.contact.address}</span>
                                </div>
                            </div>
                            
                            <div className="footer__newsletter">
                                <h4 className="footer__newsletter-title">{lang.newsletter.title}</h4>
                                <div className="footer__newsletter-form">
                                    <input 
                                        type="email" 
                                        placeholder={lang.newsletter.placeholder}
                                        className="footer__newsletter-input"
                                    />
                                    <button className="footer__newsletter-btn">
                                        {lang.newsletter.button}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer__bottom">
                        <div className="footer__copyright">
                            © {currentYear} ArtGallery. {lang.copyright}
                        </div>
                        <button className="footer__scroll-top" onClick={scrollToTop}>
                            <svg className="footer__scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 15l-6-6-6 6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
});

export default Footer;