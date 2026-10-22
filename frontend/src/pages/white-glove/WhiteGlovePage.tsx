import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronLeft, ChevronRight, ClipboardList, Frame } from 'lucide-react';
import Navigation from '../../components/layout/Navigation/Navigation';
import { useLanguage } from '../../hooks/useLanguage';
import lockIcon from '../home/icons/lock.svg';
import deliveryIcon from '../home/icons/car.svg';
import paintingImage from '../auth/authImg.png';
import packingImage from './images/packing.png';
import galleryImage from './images/gallery.png';
import photographImage from './images/photograph.png';
import { whiteGloveTranslations } from './lang';
import './WhiteGlovePage.scss';

const benefitIcons = [ClipboardList, lockIcon, BadgeCheck, deliveryIcon, Frame];
const artworkImages = [paintingImage, photographImage];

const WhiteGlovePage = () => {
    const { language } = useLanguage();
    const t = whiteGloveTranslations[language];
    const artworksRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const moveArtworks = (direction: number) => {
        const list = artworksRef.current;
        if (list) list.scrollBy({ left: direction * list.clientWidth * 0.7 });
    };

    return (
        <main className="white-glove">
            <Navigation />
            <section className="white-glove__hero white-glove__container" aria-labelledby="delivery-title">
                <div className="white-glove__hero-copy">
                    <h1 id="delivery-title">{t.title}</h1>
                    <p className="white-glove__lead">{t.introduction}<br />{t.description}</p>
                    <Link className="white-glove__button" to="/contacts">{t.action}</Link>
                </div>
                <img className="white-glove__hero-image" src={packingImage} alt={t.heroAlt} width="868" height="557" fetchPriority="high" />
            </section>

            <section className="white-glove__benefits" aria-labelledby="delivery-benefits">
                <div className="white-glove__container">
                    <h2 id="delivery-benefits">{t.benefitsTitle}</h2>
                    <div className="white-glove__benefit-grid">
                        {t.benefits.map((item, index) => {
                            const Icon = benefitIcons[index];
                            return (
                                <article className="white-glove__benefit" key={item.title}>
                                    <div className="white-glove__benefit-icon" aria-hidden="true">
                                        {typeof Icon === 'string' ? <img src={Icon} alt="" /> : <Icon size={100} strokeWidth={1.5} />}
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="white-glove__artworks white-glove__container" aria-labelledby="delivery-artworks">
                <h2 id="delivery-artworks">{t.artworksTitle}</h2>
                <div className="white-glove__artwork-gallery">
                    <div className="white-glove__artwork-list" ref={artworksRef} tabIndex={0} role="region" aria-label={t.artworksLabel}>
                        {t.artworks.map((item, index) => (
                            <article className="white-glove__artwork" key={item.title}>
                                <img src={artworkImages[index]} alt={item.alt} width={index === 0 ? 868 : 422} height={index === 0 ? 802 : 368} loading="lazy" />
                                <div className="white-glove__artwork-copy">
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                    <Link className="white-glove__button" to="/contacts">{t.action}</Link>
                                    <small>{t.priceNote}</small>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="white-glove__gallery-controls">
                        <button type="button" onClick={() => moveArtworks(-1)} aria-label={t.previous}><ChevronLeft size={24} aria-hidden="true" /></button>
                        <button type="button" onClick={() => moveArtworks(1)} aria-label={t.next}><ChevronRight size={24} aria-hidden="true" /></button>
                    </div>
                </div>
            </section>

            <section className="white-glove__placement white-glove__container" aria-labelledby="delivery-placement">
                <h2 id="delivery-placement">{t.placementTitle}</h2>
                <p className="white-glove__intro">{t.placementIntro}</p>
                <div className="white-glove__placement-grid">
                    <img className="white-glove__placement-image" src={galleryImage} alt={t.placementAlt} width="866" height="529" loading="lazy" />
                    <div className="white-glove__lighting">
                        {t.lighting.map(item => <div key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}
                        <div className="white-glove__conclusion"><p>{t.lightingConclusion}</p><p>{t.lightingDescription}</p></div>
                        <Link className="white-glove__button" to="/contacts">{t.action}</Link>
                    </div>
                </div>
            </section>

            <section className="white-glove__installation white-glove__container" aria-labelledby="delivery-installation">
                <div className="white-glove__installation-grid">
                    <div className="white-glove__installation-copy">
                        <h2 id="delivery-installation">{t.installationTitle}</h2>
                        <p className="white-glove__intro">{t.installationIntro}</p>
                        <ol>
                            {t.installation.map((item, index) => (
                                <li key={item.title}>
                                    <span className="white-glove__step" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                                    <div><h3>{item.title}</h3><p>{item.text}</p></div>
                                </li>
                            ))}
                        </ol>
                        <Link className="white-glove__button" to="/contacts">{t.action}</Link>
                    </div>
                    <img className="white-glove__installation-image" src={galleryImage} alt={t.placementAlt} width="866" height="529" loading="lazy" />
                </div>
            </section>
        </main>
    );
};

export default WhiteGlovePage;
